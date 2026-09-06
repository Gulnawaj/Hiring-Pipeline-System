import React, { useEffect, useState } from 'react';
import { timelineService } from '../../services/timeline.service';
import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  PlusCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const TimelineHistory = ({ applicationId, currentStage, status }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const { isInterviewer } = useAuth();

  const fetchTimeline = async () => {
    try {
      setLoading(true);

      const response = await timelineService.getTimeline(applicationId);

      const timelineEvents = Array.isArray(response.data)
        ? response.data
        : [];

      setEvents(timelineEvents);
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchTimeline();
    }
  }, [applicationId, currentStage, status]);

  const handleAddFeedback = async (e) => {
    e.preventDefault();

    const trimmedFeedback = feedback.trim();

    if (!trimmedFeedback || submittingFeedback) {
      return;
    }

    setSubmittingFeedback(true);

    try {
      /*
       * Backend expects:
       * {
       *   comments,
       *   rating,
       *   recommendation
       * }
       *
       * The current UI only collects comments.
       */
      await timelineService.addFeedback(applicationId, {
        comments: trimmedFeedback,
        rating: undefined,
        recommendation: undefined,
      });

      setFeedback('');
      await fetchTimeline();
    } catch (err) {
      console.error('Failed to submit feedback:', err);

      alert(
        err.response?.data?.error ||
          'Failed to submit feedback'
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'created':
        return (
          <PlusCircle className="w-5 h-5 text-emerald-500" />
        );

      case 'stage_change':
        return (
          <CheckCircle className="w-5 h-5 text-indigo-500" />
        );

      case 'rejected':
        return (
          <XCircle className="w-5 h-5 text-rose-500" />
        );

      case 'reinstated':
        return (
          <RotateCcw className="w-5 h-5 text-amber-500" />
        );

      case 'feedback':
        return (
          <MessageSquare className="w-5 h-5 text-blue-500" />
        );

      default:
        return (
          <Clock className="w-5 h-5 text-slate-400" />
        );
    }
  };

  const parseDetails = (details) => {
    if (!details) {
      return {};
    }

    if (typeof details === 'object') {
      return details;
    }

    try {
      return JSON.parse(details);
    } catch (err) {
      console.warn('Unable to parse timeline event details:', details);
      return {};
    }
  };

  const formatEventDate = (createdAt) => {
    if (!createdAt) {
      return 'Unknown date';
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return format(date, 'MMM d, yyyy h:mm a');
  };

  const renderEventContent = (event) => {
    const details = parseDetails(event.details);

    switch (event.event_type) {
      case 'created':
        return (
          <p>
            Application created
            {details.message ? ` — ${details.message}` : ''}
          </p>
        );

      case 'stage_change':
        return (
          <p>
            Moved from{' '}
            <span className="font-medium text-slate-700">
              {details.from_stage
                ? details.from_stage.charAt(0).toUpperCase() +
                  details.from_stage.slice(1)
                : 'Unknown'}
            </span>{' '}
            to{' '}
            <span className="font-medium text-slate-700">
              {details.to_stage
                ? details.to_stage.charAt(0).toUpperCase() +
                  details.to_stage.slice(1)
                : 'Unknown'}
            </span>
          </p>
        );

      case 'rejected':
        return (
          <p>
            Candidate rejected from{' '}
            <span className="font-medium text-slate-700">
              {details.stage_at_rejection
                ? details.stage_at_rejection.charAt(0).toUpperCase() +
                  details.stage_at_rejection.slice(1)
                : 'Unknown'}
            </span>{' '}
            stage
            {details.reason ? ` — ${details.reason}` : ''}
          </p>
        );

      case 'reinstated':
        return (
          <p>
            Candidate reinstated to{' '}
            <span className="font-medium text-slate-700">
              {details.restored_to_stage
                ? details.restored_to_stage.charAt(0).toUpperCase() +
                  details.restored_to_stage.slice(1)
                : 'Unknown'}
            </span>{' '}
            stage
          </p>
        );

      case 'feedback':
        return (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 text-slate-700 italic">
            <div>
              "{details.comments || 'No feedback comments provided.'}"
            </div>

            {details.rating !== null &&
              details.rating !== undefined && (
                <div className="mt-2 text-xs text-slate-500 not-italic">
                  Rating: {details.rating}/5
                </div>
              )}

            {details.recommendation && (
              <div className="mt-1 text-xs text-slate-500 not-italic">
                Recommendation:{' '}
                {String(details.recommendation).replace(
                  /_/g,
                  ' '
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <p className="text-slate-500">
            {details.message || 'Activity recorded'}
          </p>
        );
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-slate-500" />
        Activity History
      </h2>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">

          {events.map((event, index) => (
            <div
              key={event.id || event._id || `${event.event_type}-${index}`}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {getEventIcon(event.event_type)}
              </div>

              {/* Event card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1 gap-4">
                  <div className="font-semibold text-slate-900 text-sm">
                    {event.actor_name || 'System'}
                  </div>

                  <time className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    {formatEventDate(event.created_at)}
                  </time>
                </div>

                <div className="text-slate-600 text-sm mt-2">
                  {renderEventContent(event)}
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center text-slate-500 py-4 relative z-10 bg-white">
              No history found for this application.
            </div>
          )}
        </div>
      )}

      {/* Interviewer Feedback Form */}
      {isInterviewer && status !== 'rejected' && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Add Feedback
          </h3>

          <form
            onSubmit={handleAddFeedback}
            className="flex items-start space-x-3"
          >
            <div className="flex-1">
              <textarea
                rows={3}
                className="input-field p-3 text-sm resize-none"
                placeholder="Write your interview feedback here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={
                submittingFeedback || !feedback.trim()
              }
              className="btn btn-primary whitespace-nowrap"
            >
              {submittingFeedback
                ? 'Saving...'
                : 'Submit Feedback'}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-2">
            Feedback is permanent and cannot be edited or deleted once
            submitted.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimelineHistory;