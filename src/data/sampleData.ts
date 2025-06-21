
import { ComponentData } from '../types/ComponentTypes';

export const sampleData: ComponentData[] = [
  {
    id: 'auth',
    name: 'Authentication Module',
    tags: ['security', 'user-management'],
    description: 'Handles user authentication and authorization',
    connections: ['user-profile', 'dashboard'],
    subComponents: [
      {
        id: 'login',
        name: 'Login Component',
        tags: ['security', 'forms'],
        description: 'User login interface',
        connections: ['auth-service']
      },
      {
        id: 'register',
        name: 'Registration Component',
        tags: ['security', 'forms'],
        description: 'User registration interface',
        connections: ['auth-service']
      },
      {
        id: 'auth-service',
        name: 'Auth Service',
        tags: ['security', 'api'],
        description: 'Authentication logic and API calls',
        connections: ['database']
      }
    ]
  },
  {
    id: 'user-profile',
    name: 'User Profile Module',
    tags: ['user-management', 'ui'],
    description: 'User profile management and display',
    connections: ['database'],
    subComponents: [
      {
        id: 'profile-view',
        name: 'Profile View',
        tags: ['ui', 'display'],
        description: 'Display user profile information'
      },
      {
        id: 'profile-edit',
        name: 'Profile Editor',
        tags: ['ui', 'forms'],
        description: 'Edit user profile interface',
        connections: ['profile-service']
      },
      {
        id: 'profile-service',
        name: 'Profile Service',
        tags: ['api', 'user-management'],
        description: 'Profile management API',
        connections: ['database']
      }
    ]
  },
  {
    id: 'dashboard',
    name: 'Dashboard Module',
    tags: ['ui', 'analytics'],
    description: 'Main application dashboard',
    connections: ['analytics', 'notifications'],
    subComponents: [
      {
        id: 'dashboard-view',
        name: 'Dashboard View',
        tags: ['ui', 'display'],
        description: 'Main dashboard interface'
      },
      {
        id: 'widget-container',
        name: 'Widget Container',
        tags: ['ui', 'layout'],
        description: 'Container for dashboard widgets',
        connections: ['analytics-widget']
      },
      {
        id: 'analytics-widget',
        name: 'Analytics Widget',
        tags: ['analytics', 'ui'],
        description: 'Display analytics data',
        connections: ['analytics']
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics Module',
    tags: ['analytics', 'data'],
    description: 'Data analytics and reporting',
    connections: ['database'],
    subComponents: [
      {
        id: 'data-processor',
        name: 'Data Processor',
        tags: ['analytics', 'processing'],
        description: 'Process and analyze data'
      },
      {
        id: 'report-generator',
        name: 'Report Generator',
        tags: ['analytics', 'reports'],
        description: 'Generate analytics reports',
        connections: ['data-processor']
      }
    ]
  },
  {
    id: 'notifications',
    name: 'Notification System',
    tags: ['communication', 'ui'],
    description: 'Handle system notifications',
    connections: ['user-profile'],
    subComponents: [
      {
        id: 'notification-service',
        name: 'Notification Service',
        tags: ['communication', 'api'],
        description: 'Notification management service'
      },
      {
        id: 'notification-ui',
        name: 'Notification UI',
        tags: ['communication', 'ui'],
        description: 'Display notifications to users',
        connections: ['notification-service']
      }
    ]
  },
  {
    id: 'database',
    name: 'Database Layer',
    tags: ['data', 'storage'],
    description: 'Data persistence and storage',
    subComponents: [
      {
        id: 'user-repository',
        name: 'User Repository',
        tags: ['data', 'user-management'],
        description: 'User data access layer'
      },
      {
        id: 'analytics-repository',
        name: 'Analytics Repository',
        tags: ['data', 'analytics'],
        description: 'Analytics data access layer'
      }
    ]
  }
];
