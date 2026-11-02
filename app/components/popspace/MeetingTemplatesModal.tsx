'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { CanvasWidget } from '../spatial/types';

export interface TemplateDefinition {
  id: string;
  title: string;
  description: string;
  image: string;
  generateWidgets: (centerX: number, centerY: number) => CanvasWidget[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'brainstorm',
    title: 'Brainstorming',
    description: 'Sticky notes cluster with a central ideas board',
    image: '/templates/template_brainstorm.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-1`,
        type: 'sticky',
        x: cx - 180,
        y: cy - 120,
        text: '💡 Wild Ideas\n• What if we...',
        color: 'mandarin',
        creatorId: 'template',
      },
      {
        id: `sticky-${Date.now()}-2`,
        type: 'sticky',
        x: cx + 40,
        y: cy - 120,
        text: '🔥 Must Haves\n• Mobile touch gestures\n• Proximity audio',
        color: 'cherry',
        creatorId: 'template',
      },
      {
        id: `sticky-${Date.now()}-3`,
        type: 'sticky',
        x: cx - 70,
        y: cy + 100,
        text: '✨ Customer Feedback\n• Loving the cute avatars!',
        color: 'lavender',
        creatorId: 'template',
      },
    ],
  },
  {
    id: '1on1',
    title: '1-on-1 Catchup',
    description: 'Cozy two-person table with an agenda pad',
    image: '/templates/template_1on1.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-agenda`,
        type: 'sticky',
        x: cx - 100,
        y: cy - 90,
        text: '📋 1-on-1 Agenda\n1. What went well this week?\n2. What was hardest?\n3. How can I help?',
        color: 'oregano',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'happyHour',
    title: 'Happy Hour Lounge',
    description: 'Lofi music TV with social discussion circles',
    image: '/templates/template_happyHour.png',
    generateWidgets: (cx, cy) => [
      {
        id: `yt-lofi-${Date.now()}`,
        type: 'youtube',
        youtubeId: 'jfKfPfyJRdk', // Lofi Girl chill beats
        isPlaying: true,
        timestamp: 0,
        playStartedUtc: Date.now(),
        x: cx - 180,
        y: cy - 150,
        creatorId: 'template',
      },
      {
        id: `sticky-${Date.now()}-icebreaker`,
        type: 'sticky',
        x: cx + 220,
        y: cy - 80,
        text: '🍹 Question of the Day:\nWhat is the most chaotic thing you did in high school?',
        color: 'blueberry',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'retrospective',
    title: 'Sprint Retrospective',
    description: 'Start, Stop, and Continue boards',
    image: '/templates/template_retrospective.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-start`,
        type: 'sticky',
        x: cx - 260,
        y: cy - 100,
        text: '🟢 START\n• More spontaneous drop-ins',
        color: 'oregano',
        creatorId: 'template',
      },
      {
        id: `sticky-${Date.now()}-stop`,
        type: 'sticky',
        x: cx - 40,
        y: cy - 100,
        text: '🔴 STOP\n• 45-minute scheduled Zoom meetings',
        color: 'cherry',
        creatorId: 'template',
      },
      {
        id: `sticky-${Date.now()}-cont`,
        type: 'sticky',
        x: cx + 180,
        y: cy - 100,
        text: '🟡 CONTINUE\n• Sunlit paper design system',
        color: 'mandarin',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'daily',
    title: 'Daily Stand-Up',
    description: 'Identify and tackle daily roadblocks.',
    image: '/templates/template_daily.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-standup`,
        type: 'sticky',
        x: cx - 100,
        y: cy - 80,
        text: '⚡ Daily Sync\n1. What did you finish?\n2. What is today?\n3. Any blockers?',
        color: 'lavender',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'weekly',
    title: 'Weekly Sync-Up',
    description: "Check in on the team's progress.",
    image: '/templates/template_weekly.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-weekly`,
        type: 'sticky',
        x: cx - 140,
        y: cy - 90,
        text: "📅 Weekly Agenda\n• Highlights & Wins\n• KPI & Metrics Review\n• Key Initiatives for the Week",
        color: 'blueberry',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'allHands',
    title: 'All-Hands Meeting',
    description: 'Keep everybody aligned with goals.',
    image: '/templates/template_allHands.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-allhands`,
        type: 'sticky',
        x: cx - 180,
        y: cy - 100,
        text: '🎙️ Company All-Hands\n• Company Updates & Vision\n• Product Milestones\n• Open Q&A Session',
        color: 'mandarin',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'interview',
    title: 'Remote Interview',
    description: 'Find great people for your team.',
    image: '/templates/template_interview.png',
    generateWidgets: (cx, cy) => [
      {
        id: `sticky-${Date.now()}-interview`,
        type: 'sticky',
        x: cx - 120,
        y: cy - 90,
        text: '💼 Candidate Interview\n• Background & Experience\n• Deep-Dive Project Walkthrough\n• Candidate Questions for Us',
        color: 'oregano',
        creatorId: 'template',
      },
    ],
  },
  {
    id: 'blank',
    title: 'Blank',
    description: 'A blank room for your custom needs.',
    image: '/templates/template_blank.png',
    generateWidgets: () => [],
  },
];

interface MeetingTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateDefinition) => void;
}

export const MeetingTemplatesModal: React.FC<MeetingTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(45, 49, 57, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 64px rgba(60, 50, 40, 0.2)',
          border: '1px solid #EAE5DF',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F1A41D', marginBottom: '4px' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Room Templates
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#2D3139', margin: 0 }}>
              Choose a room layout
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#F4F5F8',
              color: '#575F75',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                border: '1.5px solid #EAE5DF',
                backgroundColor: '#FFF8F0',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F1A41D';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(241, 164, 29, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#EAE5DF';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '110px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  marginBottom: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={tmpl.image}
                  alt={tmpl.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                />
              </div>

              <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D3139', marginBottom: '2px' }}>
                {tmpl.title}
              </span>
              <span style={{ fontSize: '12px', color: '#575F75', lineHeight: '1.35' }}>
                {tmpl.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
