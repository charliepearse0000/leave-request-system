'use client';

import React from 'react';

type RequestItem = {
  id: string;
  leaveType: { name: string };
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedAt?: string;
};

interface RequestsListViewProps {
  requests: RequestItem[];
  cancellingIds?: Set<string>;
}

export default function RequestsListView({ requests, cancellingIds = new Set() }: RequestsListViewProps) {
  return (
    <div>
      {requests.map((request) => (
        <div key={request.id} aria-label={`request-${request.id}`} style={{ padding: '8px 0' }}>
          <div>{request.leaveType.name}</div>
          <div>{request.status}</div>
          {request.status === 'pending' && (
            <button
              type="button"
              disabled={cancellingIds.has(request.id)}
            >
              {cancellingIds.has(request.id) ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}