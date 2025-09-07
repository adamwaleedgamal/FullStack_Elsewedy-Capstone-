import React, { useState } from 'react';
import { Search, MessageSquare, Star, Users, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import './PanelReview.css';

const PanelReview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Mock data for panel feedback
  const panelFeedback = [
    {
      id: 1,
      teamName: "Team Alpha",
      presentationDate: "2024-01-20",
      presentationTitle: "Smart Home Automation System",
      judges: ["Dr. Ahmed Hassan", "Prof. Sarah Mohamed", "Eng. Omar Ali"],
      overallScore: 85,
      feedback: {
        strengths: [
          "Excellent technical implementation with innovative IoT integration",
          "Clear and well-structured presentation",
          "Strong problem identification and solution approach",
          "Good user interface design and user experience"
        ],
        improvements: [
          "Consider scalability aspects for larger deployments",
          "Add more comprehensive security measures",
          "Include cost-benefit analysis in the presentation",
          "Provide more detailed testing documentation"
        ],
        technicalScore: 88,
        presentationScore: 82,
        innovationScore: 85,
        comments: "Overall, this is a very promising project with strong technical foundations. The team demonstrated excellent understanding of the problem domain and provided a well-thought-out solution. The presentation was professional and engaging."
      }
    },
    {
      id: 2,
      teamName: "Team Beta",
      presentationDate: "2024-01-22",
      presentationTitle: "E-Learning Platform for Remote Education",
      judges: ["Dr. Fatima Ahmed", "Prof. Khalid Omar", "Eng. Aisha Hassan"],
      overallScore: 78,
      feedback: {
        strengths: [
          "Comprehensive feature set addressing real educational needs",
          "Good understanding of user requirements",
          "Effective use of modern web technologies",
          "Well-organized project structure"
        ],
        improvements: [
          "Enhance mobile responsiveness",
          "Add more interactive learning features",
          "Improve accessibility features",
          "Include analytics and progress tracking"
        ],
        technicalScore: 75,
        presentationScore: 80,
        innovationScore: 79,
        comments: "The project shows good potential and addresses a relevant problem in education. The team has a solid foundation but could benefit from more advanced features and better mobile experience."
      }
    },
    {
      id: 3,
      teamName: "Team Gamma",
      presentationDate: "2024-01-25",
      presentationTitle: "Healthcare Management System",
      judges: ["Dr. Youssef Ali", "Prof. Nour Mohamed", "Eng. Hassan Ahmed"],
      overallScore: 92,
      feedback: {
        strengths: [
          "Outstanding technical architecture and implementation",
          "Excellent security and privacy considerations",
          "Comprehensive testing and documentation",
          "Professional presentation with clear business value",
          "Innovative use of AI for patient care optimization"
        ],
        improvements: [
          "Consider integration with existing hospital systems",
          "Add more detailed compliance documentation",
          "Include performance benchmarks for large datasets"
        ],
        technicalScore: 95,
        presentationScore: 90,
        innovationScore: 91,
        comments: "This is an exceptional project that demonstrates advanced technical skills and deep understanding of healthcare domain requirements. The implementation is production-ready and the presentation was outstanding."
      }
    }
  ];

  const filteredFeedback = panelFeedback.filter(feedback =>
    feedback.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.presentationTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score) => {
    if (score >= 90) return '#38a169';
    if (score >= 80) return '#3182ce';
    if (score >= 70) return '#d69e2e';
    return '#e53e3e';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return '#f0fff4';
    if (score >= 80) return '#ebf8ff';
    if (score >= 70) return '#fffbeb';
    return '#fed7d7';
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return <ThumbsUp size={16} className="score-icon excellent" />;
    if (score >= 80) return <ThumbsUp size={16} className="score-icon good" />;
    if (score >= 70) return <ThumbsUp size={16} className="score-icon average" />;
    return <ThumbsDown size={16} className="score-icon poor" />;
  };

  return (
    <div className="panel-review">
      <div className="panel-review-header">
        <h1 className="panel-review-title">Panel Review Feedback</h1>
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search teams or presentations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="feedback-list">
        {filteredFeedback.map((feedback, index) => (
          <div key={feedback.id} className="feedback-item">
            <div className="feedback-content">
              <div className="feedback-info">
                <div className="feedback-header-info">
                  <div className="presentation-details">
                    <h3 className="presentation-title">{feedback.presentationTitle}</h3>
                    <p className="team-name">{feedback.teamName}</p>
                    <div className="presentation-meta">
                      <span className="presentation-date">
                        <Calendar size={16} />
                        {feedback.presentationDate}
                      </span>
                      <span className="judges-count">
                        <Users size={16} />
                        {feedback.judges.length} Judges
                      </span>
                    </div>
                  </div>
                  <div className="score-section">
                    <div className="overall-score">
                      <div
                        className="score-badge"
                        style={{
                          color: getScoreColor(feedback.overallScore),
                          backgroundColor: getScoreBgColor(feedback.overallScore),
                        }}
                      >
                        {getScoreIcon(feedback.overallScore)}
                        {feedback.overallScore}/100
                      </div>
                    </div>
                    <div className="detailed-scores">
                      <span className="score-item">
                        Technical: {feedback.feedback.technicalScore}
                      </span>
                      <span className="score-item">
                        Presentation: {feedback.feedback.presentationScore}
                      </span>
                      <span className="score-item">
                        Innovation: {feedback.feedback.innovationScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feedback-actions">
                <button
                  className="feedback-action-btn view-btn"
                  onClick={() => setSelectedFeedback(selectedFeedback?.id === feedback.id ? null : feedback)}
                >
                  <MessageSquare size={16} />
                  {selectedFeedback?.id === feedback.id ? 'Hide Details' : 'View Details'}
                </button>
              </div>
            </div>

            {selectedFeedback?.id === feedback.id && (
              <div className="feedback-details">
                <div className="details-section">
                  <h4>Panel Judges:</h4>
                  <div className="judges-list">
                    {feedback.judges.map((judge, judgeIndex) => (
                      <span key={judgeIndex} className="judge-tag">{judge}</span>
                    ))}
                  </div>
                </div>

                <div className="feedback-content-details">
                  <div className="strengths-section">
                    <h4>Strengths:</h4>
                    <ul className="feedback-list strengths">
                      {feedback.feedback.strengths.map((strength, strengthIndex) => (
                        <li key={strengthIndex}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="improvements-section">
                    <h4>Areas for Improvement:</h4>
                    <ul className="feedback-list improvements">
                      {feedback.feedback.improvements.map((improvement, improvementIndex) => (
                        <li key={improvementIndex}>{improvement}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="comments-section">
                    <h4>Overall Comments:</h4>
                    <p className="comments-text">{feedback.feedback.comments}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="no-results">
          <p>No panel feedback found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default PanelReview;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead 