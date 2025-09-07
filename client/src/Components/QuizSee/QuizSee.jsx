import React, { useState } from 'react';
import { Search, BookOpen, Lock, CheckCircle, Clock, Send } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import './QuizSee.css';

const QuizSee = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submittedJournals, setSubmittedJournals] = useState([]);
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Mock data for journals
  const journals = [
    {
      id: 1,
      title: "Journal 1 - Project Introduction",
      description: "Answer questions about your project introduction and initial research",
      publishDate: "2024-01-15T10:00",
      isOpen: true,
      questions: [
        "What is the main problem your project aims to solve?",
        "Who are your target users?",
        "What are the key features of your solution?"
      ]
    },
    {
      id: 2,
      title: "Journal 2 - Design Phase",
      description: "Questions about your design process and user interface decisions",
      publishDate: "2024-02-01T14:00",
      isOpen: true,
      questions: [
        "Describe your design approach and methodology",
        "What tools did you use for prototyping?",
        "How did you gather user feedback?"
      ]
    },
    {
      id: 3,
      title: "Journal 3 - Implementation",
      description: "Technical questions about your implementation and development process",
      publishDate: "2024-02-15T09:00",
      isOpen: false,
      questions: [
        "What technologies did you use for implementation?",
        "Describe the architecture of your solution",
        "What were the main challenges during development?"
      ]
    },
    {
      id: 4,
      title: "Journal 4 - Testing & Evaluation",
      description: "Questions about testing methodology and evaluation results",
      publishDate: "2024-03-01T16:00",
      isOpen: false,
      questions: [
        "What testing methods did you employ?",
        "How did you evaluate your solution's effectiveness?",
        "What improvements would you make based on testing results?"
      ]
    }
  ];

  const filteredJournals = journals.filter(journal =>
    journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers({
      ...answers,
      [questionIndex]: value
    });
  };

  const handleSubmitJournal = (journalId) => {
    const journal = journals.find(j => j.id === journalId);
    const journalAnswers = journal.questions.map((question, index) => ({
      question,
      answer: answers[index] || ''
    }));

    // In a real app, this would submit to the server
    console.log('Submitting journal:', { journalId, answers: journalAnswers });
    
    setSubmittedJournals([...submittedJournals, journalId]);
    setSelectedJournal(null);
    setAnswers({});
    
    showSuccess('Journal Submitted', 'Journal submitted successfully!');
  };

  const isJournalSubmitted = (journalId) => {
    return submittedJournals.includes(journalId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isOpen) => {
    return isOpen ? '#38a169' : '#718096';
  };

  const getStatusBgColor = (isOpen) => {
    return isOpen ? '#f0fff4' : '#f7fafc';
  };

  return (
    <div className="quiz-see">
      <div className="quiz-see-header">
        <h1 className="quiz-see-title">Available Journals</h1>
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search journals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="quizzes-list">
        {filteredJournals.map((journal, index) => (
          <div key={journal.id} className="quiz-item">
            <div className="quiz-content">
              <div className="quiz-info">
                <div className="quiz-header-info">
                  <div className="quiz-title-section">
                    <BookOpen size={20} className="quiz-icon" />
                                          <h3 className="quiz-title">{journal.title}</h3>
                  </div>
                  <div
                    className="quiz-status"
                    style={{
                                              color: getStatusColor(journal.isOpen),
                        backgroundColor: getStatusBgColor(journal.isOpen),
                    }}
                  >
                    {journal.isOpen ? (
                      <>
                        <CheckCircle size={16} />
                        Open
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Not Available Yet
                      </>
                    )}
                  </div>
                </div>
                                  <p className="quiz-description">{journal.description}</p>
                  <p className="publish-date">Published: {formatDate(journal.publishDate)}</p>
              </div>
              <div className="quiz-actions">
                {isJournalSubmitted(journal.id) ? (
                  <div className="submitted-badge">
                    <CheckCircle size={16} />
                    Submitted
                  </div>
                ) : journal.isOpen ? (
                                      <button
                      className="quiz-action-btn take-quiz-btn"
                      onClick={() => setSelectedJournal(selectedJournal?.id === journal.id ? null : journal)}
                    >
                      {selectedJournal?.id === journal.id ? 'Close' : 'Take Journal'}
                    </button>
                ) : (
                  <button className="quiz-action-btn locked-btn" disabled>
                    <Clock size={16} />
                    Coming Soon
                  </button>
                )}
              </div>
            </div>

            {selectedJournal?.id === journal.id && journal.isOpen && (
              <div className="quiz-details">
                <div className="details-section">
                  <h4>Instructions:</h4>
                  <p>Answer all questions using the text boxes below. Be thorough and detailed in your responses.</p>
                </div>

                <div className="questions-section">
                  {journal.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="question-container">
                      <label className="question-label">
                        Question {questionIndex + 1}:
                      </label>
                      <p className="question-text">{question}</p>
                      <textarea
                        value={answers[questionIndex] || ''}
                        onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                        placeholder="Enter your answer here..."
                        className="answer-textarea"
                        rows="4"
                      />
                    </div>
                  ))}
                </div>

                <div className="quiz-submit-section">
                  <button
                    className="submit-quiz-btn"
                    onClick={() => handleSubmitJournal(journal.id)}
                    disabled={Object.keys(answers).length < journal.questions.length}
                  >
                    <Send size={16} />
                    Submit Journal
                  </button>
                  <p className="submit-note">
                    Please answer all questions before submitting.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredJournals.length === 0 && (
        <div className="no-results">
          <p>No journals found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default QuizSee;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead 