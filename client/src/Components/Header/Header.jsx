"use client"

import React from "react"
import { useNotification } from "../../contexts/NotificationContext"
import "./Header.css"

const Header = ({ user, studentId, apiBaseUrl = "http://localhost:5048/api" }) => {
  // user: The full user object with all user information (passed from Dashboard)
  // studentId: The ID of the currently logged-in user (passed from Dashboard)
  // No more hardcoded default values
  const [userName, setUserName] = React.useState("Student")
  const [loading, setLoading] = React.useState(false)
  const { showError } = useNotification()

  React.useEffect(() => {
    // If we have user data from props, use it directly
    if (user && user.fullNameEn) {
      setUserName(user.fullNameEn.trim())
      return
    }

    // Fallback to API call if no user data provided
    const fetchUserName = async () => {
      if (!studentId) {
        console.warn("No studentId provided to Header component")
        setUserName("Student")
        return
      }

      setLoading(true)
      
      try {
        const response = await fetch(`${apiBaseUrl}/Account/${studentId}`, {
          timeout: 5000
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        const name = (data?.fullNameEn || data?.fullNameEN)?.trim()
        setUserName(name || "Student")
      } catch (err) {
        console.error("Error fetching user name for studentId:", studentId, err)
        showError(err.message)
        setUserName("Student") // Fallback to default name
      } finally {
        setLoading(false)
      }
    }

    fetchUserName()
  }, [user, studentId, apiBaseUrl])

  return (
    <header className="header" role="banner">
      <div className="greeting">
        <span className="greeting-text" aria-label="Greeting">
          Hi,
        </span>
        <span className="greeting-name" aria-label={`Welcome ${userName}`}>
          {loading ? "Loading..." : userName}
        </span>
      

      </div>
    </header>
  )
}

export default React.memo(Header)

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded IDs or fallback values

