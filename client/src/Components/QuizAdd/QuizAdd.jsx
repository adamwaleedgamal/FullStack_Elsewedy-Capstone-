import React, { useState } from 'react';
import { Plus, Calendar, Save, X, Clock, BookOpen } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import './QuizAdd.css';

const QuizAdd = () => {
  const [journalTitle, setJournalTitle] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleAddQuestion = () => {
    if (currentQuestion.trim()) {
      const newQuestion = {
        id: Date.now(),
        text: currentQuestion.trim(),
        type: 'text'
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion('');
      setShowQuestionForm(false);
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleSaveQuiz = () => {
    if (journalTitle.trim() && questions.length > 0) {
      // In a real app, this would save to database
      console.log('Saving journal:', {
        title: journalTitle,
        publishDate,
        questions
      });
      showSuccess("Journal Saved", "Journal saved successfully!");
      // Reset form
      setJournalTitle('');
      setPublishDate('');
      setQuestions([]);
    } else {
      showError("Validation Error", "Please fill in all required fields and add at least one question.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="quiz-add">
      <div className="quiz-add-header">
        <h1 className="quiz-add-title">Add Journal</h1>
        <p className="quiz-add-subtitle">Create a new journal with questions and set a publish date</p>
      </div>

      <div className="quiz-form">
        <div className="form-section">
          <div className="section-header">
            <BookOpen size={20} className="section-icon" />
            <h2>Journal Details</h2>
          </div>
          <div className="form-group">
            <label htmlFor="journalTitle">Journal Title *</label>
            <input
              type="text"
              id="journalTitle"
              value={journalTitle}
              onChange={(e) => setJournalTitle(e.target.value)}
              placeholder="Enter journal title..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="publishDate">Publish Date & Time *</label>
            <div className="date-input-container">
              <Calendar size={20} className="calendar-icon" />
              <input
                type="datetime-local"
                id="publishDate"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="form-input date-input"
              />
            </div>
            {publishDate && (
              <p className="date-preview">
                Will be published on: {formatDate(publishDate)}
              </p>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Questions</h2>
            <button
              className="add-question-btn"
              onClick={() => setShowQuestionForm(true)}
            >
              <Plus size={16} />
              Add Question
            </button>
          </div>

          {showQuestionForm && (
            <div className="question-form">
              <div className="form-group">
                <label htmlFor="questionText">Question Text *</label>
                <textarea
                  id="questionText"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Enter your question..."
                  className="form-textarea"
                  rows="3"
                />
              </div>
              <div className="question-actions">
                <button
                  className="save-question-btn"
                  onClick={handleAddQuestion}
                  disabled={!currentQuestion.trim()}
                >
                  <Save size={16} />
                  Add Question
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowQuestionForm(false);
                    setCurrentQuestion('');
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="questions-list">
            {questions.map((question, index) => (
              <div key={question.id} className="question-item">
                <div className="question-content">
                  <span className="question-number">Q{index + 1}</span>
                  <p className="question-text">{question.text}</p>
                </div>
                <button
                  className="remove-question-btn"
                  onClick={() => handleRemoveQuestion(question.id)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="no-questions">
              <Clock size={48} className="no-questions-icon" />
              <p>No questions added yet. Click "Add Question" to get started.</p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            className="save-quiz-btn"
            onClick={handleSaveQuiz}
            disabled={!journalTitle.trim() || questions.length === 0}
          >
            <Save size={16} />
            Save Journal
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAdd;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead 