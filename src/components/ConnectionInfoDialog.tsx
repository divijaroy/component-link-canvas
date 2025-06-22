import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight, MessageSquare } from 'lucide-react';

interface SimpleConnection {
  id: string;
  name: string;
  source: string;
  target: string;
  description?: string;
  status?: string;
}

interface ConnectionInfoDialogProps {
  connection: SimpleConnection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectionInfoDialog = ({ connection, open, onOpenChange }: ConnectionInfoDialogProps) => {
  if (!connection) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'unhealthy':
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-roboto font-semibold text-blue-700">
                {connection.name}
              </div>
              <div className="text-sm text-blue-500 font-normal">
                Connection
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {connection.description && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{connection.description}</p>
            </div>
          )}

          {/* Connection Flow */}
          <div>
            <h3 className="font-roboto font-medium text-gray-700 mb-2">Connection Flow</h3>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 text-sm font-medium text-gray-800">
                {connection.source}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <div className="flex-1 text-sm font-medium text-gray-800 text-right">
                {connection.target}
              </div>
            </div>
          </div>

          {/* Status */}
          {connection.status && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Status</h3>
              <Badge className={`${getStatusColor(connection.status)} border`}>
                {connection.status}
              </Badge>
            </div>
          )}

          {/* Connection ID */}
          <div>
            <h3 className="font-roboto font-medium text-gray-700 mb-2">Connection ID</h3>
            <div className="p-2 bg-gray-50 rounded text-sm font-mono text-gray-600">
              {connection.id}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
