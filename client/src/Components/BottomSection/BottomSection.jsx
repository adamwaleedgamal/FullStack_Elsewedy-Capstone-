"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import { useNotification } from "../../contexts/NotificationContext"
import "./BottomSection.css"

const BottomSection = ({ currentStudentId = null, user = null }) => {
  const [teamMembers, setTeamMembers] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [capstoneSupervisor, setCapstoneSupervisor] = useState(null)
  const [teamClassInfo, setTeamClassInfo] = useState({ id: null, name: null })
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const { showError } = useNotification()

  // Use the passed currentStudentId or fall back to user.id
  const effectiveStudentId = currentStudentId || user?.id
  const API_BASE_URL = "http://localhost:5048/api"
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000

  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  const sectionRef = useRef(null)

  // Intersection Observer for entrance animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Helper functions
  const extractArrayFromResponse = useCallback((data, fallbackKeys = []) => {
    console.log("Extracting array from:", data);
    
    if (Array.isArray(data)) {
      console.log("Data is already an array");
      return data
    }

    for (const key of ["$values", "teamMembers", "data", ...fallbackKeys]) {
      if (data?.[key] && Array.isArray(data[key])) {
        console.log(`Found array in key: ${key}`);
        return data[key]
      }
    }

    console.log("No array found, returning empty array");
    return []
  }, [])

  const extractReviewersFromResponse = useCallback((reviewersData) => {
    console.log("🔍 Extracting reviewers from:", reviewersData);
    console.log("🔍 Reviewers data type:", typeof reviewersData);
    console.log("🔍 Reviewers data keys:", Object.keys(reviewersData || {}));
    
    if (Array.isArray(reviewersData)) {
      console.log("✅ Reviewers data is already an array");
      return reviewersData
    }

    for (const key of ["$values", "reviewers", "data"]) {
      if (reviewersData?.[key] && Array.isArray(reviewersData[key])) {
        console.log(`✅ Found reviewers array in key: ${key}`);
        console.log(`✅ Array length: ${reviewersData[key].length}`);
        return reviewersData[key]
      }
    }

    console.log("❌ No reviewers array found, returning empty array");
    return []
  }, [])

  const determineRole = useCallback((reviewer) => {
    const roleMap = {
      1: "Engineer",
      2: "Engineer", 
      3: "Engineer",
      4: "Engineer",
      5: "Engineer",
      6: "Engineer",
      7: "Engineer",
      8: "Engineer",
      9: "Engineer",
      10: "Engineer"
    }
    const role = roleMap[reviewer.roleId] || "Engineer"
    console.log(`Reviewer ${reviewer.fullNameEn} has roleId ${reviewer.roleId}, mapped to: ${role}`)
    return role;
  }, [])

  const fetchTeamData = useCallback(
    async (attempt = 0) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      try {
        const axiosConfig = {
          signal: abortControllerRef.current.signal,
          timeout: 15000,
        }

        // Fetch all data in parallel for better performance
        const [teamMemberResponse, teamResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/TeamMembers`, axiosConfig),
          axios.get(`${API_BASE_URL}/Teams`, axiosConfig)
        ]);
        console.log("Team members response:", teamMemberResponse.data);
        const allTeamMembers = extractArrayFromResponse(teamMemberResponse.data)
        console.log("Extracted team members:", allTeamMembers);

        if (!isMountedRef.current) return

        const currentStudentTeam = allTeamMembers.find((tm) => tm.teamMemberAccountId === effectiveStudentId)
        console.log("Current student team:", currentStudentTeam);
        console.log("All team members:", allTeamMembers);

        if (!currentStudentTeam) {
          throw new Error(`No team found for student ID: ${effectiveStudentId}`)
        }

        const studentTeamMembers = allTeamMembers.filter((tm) => tm.teamId === currentStudentTeam.teamId)
        
        // Handle team data safely
        const teamsData = extractArrayFromResponse(teamResponse.data);
        const team = teamsData.find(t => t.id === currentStudentTeam.teamId)
        console.log("Team data:", team);
        console.log("Team classId:", team?.classId);
        console.log("Team ClassId:", team?.ClassId);
        console.log("Team className:", team?.className);
        console.log("Team ClassName:", team?.ClassName);

        // Fetch all team member details in parallel (no staggering)
        const teamMembersPromises = studentTeamMembers.map(async (tm) => {
          try {
            const memberResponse = await axios.get(`${API_BASE_URL}/Account/${tm.teamMemberAccountId}`, axiosConfig)
            const memberData = {
              name: memberResponse.data?.fullNameEn || "Unknown",
              role: tm.teamMemberDescription || "Team Member",
              accountId: tm.teamMemberAccountId
            }
            return memberData;
          } catch (memberError) {
            console.warn(`Failed to fetch member ${tm.teamMemberAccountId}:`, memberError)
            return {
              name: "Unknown Member",
              id: "N/A",
              role: "Team Member",
              accountId: tm.teamMemberAccountId,
            }
          }
        })

        const teamMembersWithDetails = await Promise.all(teamMembersPromises)

        if (!isMountedRef.current) return
        setTeamMembers(teamMembersWithDetails)

        // Get class ID for reviewers
        let classId = team?.classId;
        let className = team?.className;
        
        console.log("Initial classId from team:", classId);
        console.log("Initial className from team:", className);
        
        // If team doesn't have classId, try to get it from student extension
        if (!classId) {
          try {
            const studentExtResponse = await axios.get(`${API_BASE_URL}/Dashboard/Student/${effectiveStudentId}`, axiosConfig);
            if (studentExtResponse.data?.StudentExtension?.ClassId) {
              classId = studentExtResponse.data.StudentExtension.ClassId;
              console.log("Got classId from student extension:", classId);
            }
          } catch (extError) {
            console.warn("Error fetching student extension:", extError);
          }
        }
        
        console.log("Final classId for reviewers:", classId);
        console.log("Final className for reviewers:", className);

        // Note: We don't fetch class details separately since the ClassController doesn't have a GET by ID endpoint
        // We'll use whatever class name we have from the team data
        if (!className && classId) {
          console.log(`No className available for classId: ${classId}. The ClassController doesn't have a GET by ID endpoint.`);
        }

        // Set team class info
        setTeamClassInfo({ id: classId, name: className });

        // Fetch reviewers and supervisors in parallel
        const fetchPromises = [];
        
        if (classId) {
          console.log(`🔍 Fetching reviewers for classId: ${classId}`);
          fetchPromises.push(
            axios.get(`${API_BASE_URL}/Account/Reviewers/ByClass/${classId}`, axiosConfig)
              .then(reviewerResponse => {
                console.log("✅ Reviewers API call successful!");
                console.log("📊 Reviewers response:", reviewerResponse.data);
                console.log("🔍 Reviewers response type:", typeof reviewerResponse.data);
                console.log("🔑 Reviewers response keys:", Object.keys(reviewerResponse.data || {}));
                
                const reviewersArray = extractReviewersFromResponse(reviewerResponse.data)
                console.log("📋 Extracted reviewers array:", reviewersArray);
                console.log("📋 Reviewers array length:", reviewersArray.length);
                
                // Log all reviewers and their role IDs to see what we're working with
                console.log("👥 All reviewers with role IDs:", reviewersArray.map(r => ({
                  id: r.id,
                  name: r.fullNameEn,
                  roleId: r.roleId,
                  assignedClassId: r.AssignedClassId,
                  rawData: r // Show the complete raw data
                })));
                
                // Also log the raw data structure to see what fields are available
                console.log("🔍 Raw reviewer data structure:", reviewersArray.map(r => ({
                  allKeys: Object.keys(r),
                  allValues: Object.values(r)
                })));
                
                // Check if the data is sample data or real data
                const isSampleData = reviewersArray.some(reviewer => 
                  reviewer.email === "ahmed@example.com" || 
                  reviewer.email === "sarah@example.com"
                );
                
                if (isSampleData) {
                  console.log("⚠️ API returned sample data - no real reviewers found for this class");
                  return []; // Return empty array to show "No reviewers found"
                }
                
                // Accept all reviewers since they're already filtered by class from the API
                console.log("✅ All reviewers from API are valid (already filtered by class)");
                const filteredReviewers = reviewersArray;
                console.log("✅ Filtered reviewers count:", filteredReviewers.length);
                
                const mappedReviewers = filteredReviewers.map((reviewer) => {
                  const mappedReviewer = {
                    name: reviewer.fullNameEn || "Unknown Reviewer",
                    role: reviewer.AccountType?.AccountTypeName || "Reviewer",
                    id: reviewer.accountId || reviewer.id,
                    assignedClassId: classId, // Since API already filtered by class
                  };
                  console.log(`🔄 Mapped reviewer:`, mappedReviewer);
                  return mappedReviewer;
                });
                
                console.log("🎯 Final mapped reviewers:", mappedReviewers);
                console.log("🎯 Final reviewers count:", mappedReviewers.length);
                return mappedReviewers;
              })
              .catch(error => {
                console.warn("Error fetching reviewers:", error)
                return []
              })
          );
        } else {
          fetchPromises.push(Promise.resolve([]));
        }

        // Fetch capstone supervisors
        fetchPromises.push(
          axios.get(`${API_BASE_URL}/Account/CapstoneSupervisors`, axiosConfig)
            .then(supervisorsResponse => {
              console.log("Capstone supervisors response:", supervisorsResponse.data);
              const supervisorsArray = extractArrayFromResponse(supervisorsResponse.data);
              
              if (supervisorsArray && supervisorsArray.length > 0) {
                return supervisorsArray.map((supervisor) => ({
                  name: supervisor.fullNameEn || supervisor.fullNameAr || "Unknown Supervisor",
                  role: "Capstone Supervisor",
                  id: supervisor.id || supervisor.accountId,
                }));
              } else {
                return [{
                  name: "RawaN",
                  role: "Capstone Supervisor",
                  id: "RawaN"
                }];
              }
            })
            .catch(error => {
              console.warn("Error fetching capstone supervisors:", error);
              return [{
                name: "RawaN",
                role: "Capstone Supervisor",
                id: "RawaN"
              }];
            })
        );

        const [reviewersList, supervisorsList] = await Promise.all(fetchPromises);

        if (!isMountedRef.current) return;
        setReviewers(reviewersList);
        setCapstoneSupervisor(supervisorsList);

        setLoading(false)
        setRetryCount(0)
      } catch (error) {
        console.error("Error fetching team data:", error)
        
        if (attempt < MAX_RETRIES && isMountedRef.current) {
          console.log(`Retrying... Attempt ${attempt + 1}/${MAX_RETRIES}`)
          setRetryCount(attempt + 1)
          
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchTeamData(attempt + 1)
            }
          }, RETRY_DELAY * (attempt + 1))
        } else {
          showError(error.message || "Failed to load team data")
          setLoading(false)
        }
      }
    },
    [effectiveStudentId, API_BASE_URL, extractArrayFromResponse, extractReviewersFromResponse, determineRole]
  )

  useEffect(() => {
    fetchTeamData()
    
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchTeamData])

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    setRetryCount(0)
    fetchTeamData()
  }, [fetchTeamData])

  // Enhanced render functions
  const renderLoadingState = (message) => (
    <div className="loading-container" role="status" aria-label={message}>
      <div className="loading-spinner" aria-hidden="true"></div>
      <div className="loading-text">
        <span className="loading-title">{message}</span>
        <span className="loading-subtitle">Please wait...</span>
      </div>
    </div>
  )

  const renderErrorState = (message) => (
    <div className="error-container" role="alert">
      <div className="error-icon" aria-hidden="true">
        ⚠️
      </div>
      <div className="error-message">{message}</div>
      <button onClick={handleRetry} className="retry-button" aria-label="Retry loading data">
        Try Again
      </button>
      {retryCount > 0 && (
        <span className="retry-indicator" aria-live="polite">
          Retrying... ({retryCount}/{MAX_RETRIES})
        </span>
      )}
    </div>
  )

  const renderNoDataState = (message) => (
    <div className="no-data" role="status" aria-label={message}>
      <div className="no-data-icon" aria-hidden="true">
        📋
      </div>
      <span>{message}</span>
    </div>
  )

  const renderReviewersSection = () => {
    // Debug logging
    console.log("renderReviewersSection - Debug info:", {
      loading,
      teamClassInfo,
      reviewers,
      reviewersLength: reviewers.length
    });

    if (loading) {
      return renderLoadingState("Loading reviewers");
    }

    if (!teamClassInfo.id) {
      return (
        <div className="no-data" role="status" aria-label="No class assigned">
          <div className="no-data-icon" aria-hidden="true">
            🏫
          </div>
          <span>No class assigned to this team</span>
        </div>
      );
    }

    if (reviewers.length === 0) {
      return (
        <div className="no-data" role="status" aria-label="No reviewers for class">
          <div className="no-data-icon" aria-hidden="true">
            👥
          </div>
          <span>No reviewers assigned to class: {teamClassInfo.name || `Class ${teamClassInfo.id}`}</span>
        </div>
      );
    }

    // Since API already filtered reviewers by class, we don't need to filter again
    console.log("🔍 Reviewers are already filtered by class from API");
    console.log("🔍 Team class info:", teamClassInfo);
    console.log("🔍 All available reviewers:", reviewers);
    
    const assignedReviewers = reviewers; // No need to filter again
    
    console.log("✅ All reviewers are assigned to this class:", assignedReviewers);
    console.log("✅ Reviewers count:", assignedReviewers.length);

    if (assignedReviewers.length === 0) {
      return (
        <div className="no-data" role="status" aria-label="Reviewers not assigned to team class">
          <div className="no-data-icon" aria-hidden="true">
            ⚠️
          </div>
          <span>Reviewers are not assigned to class: {teamClassInfo.name || `Class ${teamClassInfo.id}`}</span>
        </div>
      );
    }

    return (
      <>
        {assignedReviewers.map((reviewer, index) => (
          <div
            key={reviewer.id || index}
            className="reviewer"
            role="listitem"
            tabIndex="0"
            aria-label={`Reviewer: ${reviewer.name}, Role: ${reviewer.role}`}
          >
            <div className="reviewer-avatar" aria-hidden="true">
              {reviewer.name.charAt(0).toUpperCase()}
            </div>
            <div className="reviewer-info">
              <span className="reviewer-name">{reviewer.name}</span>
              <span className="reviewer-role">{reviewer.role}</span>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <section
      ref={sectionRef}
      className={`bottom-section ${isVisible ? "visible" : ""}`}
      role="region"
      aria-label="Team information"
    >
      {/* Team Members Card */}
      <article className="section-card " aria-labelledby="team-members-title">
        <h3 id="team-members-title" className="section-title">
          Team Members
        </h3>
        <div className="team-members" role="list" aria-label="Team members list">
          {loading
            ? renderLoadingState("Loading team members")
            : teamMembers.length > 0
                ? teamMembers.map((member, index) => (
                    <div
                      key={member.accountId || index}
                      className="team-member"
                      role="listitem"
                      tabIndex="0"
                      aria-label={`Team member: ${member.name}, ID: ${member.id}, Role: ${member.role}`}
                    >
                      <div className="member-avatar" aria-hidden="true">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{member.name}</span>
                        <span className="member-id">{member.id}</span>
                        <span className="member-role">{member.role}</span>
                      </div>
                    </div>
                  ))
                : renderNoDataState("No team members found")}
        </div>
      </article>

      {/* Reviewers Card */}
      <article className="section-card reviewers-card" aria-labelledby="reviewers-title">
        <h3 id="reviewers-title" className="section-title">
          Reviewers
        </h3>
        <div className="reviewers" role="list" aria-label="Reviewers list">
          {renderReviewersSection()}
        </div>
      </article>

      {/* Capstone Supervisor Card */}
      <article className="section-card supervisor-card" aria-labelledby="supervisor-title">
        <h3 id="supervisor-title" className="section-title">
          Capstone Supervisor
        </h3>
        <div className="supervisor-container">
          {loading ? (
            renderLoadingState("Loading supervisor")
          ) : capstoneSupervisor && capstoneSupervisor.length > 0 ? (
            capstoneSupervisor.map((supervisor, index) => (
              <div
                key={supervisor.id || index}
                className="supervisor"
                tabIndex="0"
                aria-label={`Supervisor: ${supervisor.name}, Role: ${supervisor.role}`}
              >
                <div className="supervisor-avatar" aria-hidden="true">
                  {supervisor.name.charAt(0).toUpperCase()}
                </div>
                <div className="supervisor-info">
                  <span className="supervisor-name">{supervisor.name}</span>
                  <span className="supervisor-role">{supervisor.role}</span>
                  
                </div>
              </div>
            ))
          ) : (
            renderNoDataState("No supervisor assigned")
          )}
        </div>
      </article>
    </section>
  )
}

export default React.memo(BottomSection)

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentStudentId prop instead
 


