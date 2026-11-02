'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { generateRoomId } from '@/lib/client-utils';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface MeetingTemplate {
  id: string;
  title: string;
  description: string;
  image: string;
}

const TEMPLATES: MeetingTemplate[] = [
  {
    id: 'brainstorm',
    title: 'Brainstorm',
    description: 'Ideate as a group to solve problems.',
    image: '/templates/template_brainstorm.png',
  },
  {
    id: 'daily',
    title: 'Daily Stand-Up',
    description: 'Identify and tackle daily roadblocks.',
    image: '/templates/template_daily.png',
  },
  {
    id: 'weekly',
    title: 'Weekly Sync-Up',
    description: "Check in on the team's progress.",
    image: '/templates/template_weekly.png',
  },
  {
    id: '1on1',
    title: 'One-on-One',
    description: 'Build a relationship in a cozy place.',
    image: '/templates/template_1on1.png',
  },
  {
    id: 'allHands',
    title: 'All-Hands Meeting',
    description: 'Keep everybody aligned with goals.',
    image: '/templates/template_allHands.png',
  },
  {
    id: 'retrospective',
    title: 'Team Retrospective',
    description: 'Evaluate goals and reflect on setbacks.',
    image: '/templates/template_retrospective.png',
  },
  {
    id: 'interview',
    title: 'Remote Interview',
    description: 'Find great people for your team.',
    image: '/templates/template_interview.png',
  },
  {
    id: 'happyHour',
    title: 'Happy Hour',
    description: 'Build trust and bond with the team.',
    image: '/templates/template_happyHour.png',
  },
  {
    id: 'blank',
    title: 'Blank',
    description: 'A blank room for your custom needs.',
    image: '/templates/template_blank.png',
  },
];

export default function Page() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const roomId = generateRoomId();
    router.push(`/rooms/${roomId}?template=${templateId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

    let cleanRoom = roomInput.trim();
    if (cleanRoom.includes('/rooms/')) {
      cleanRoom = cleanRoom.split('/rooms/')[1].split('?')[0].split('#')[0];
    } else if (cleanRoom.startsWith('http')) {
      const parts = cleanRoom.split('/');
      cleanRoom = parts[parts.length - 1];
    }

    router.push(`/rooms/${cleanRoom}`);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
        backgroundSize: '28px 28px',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 80px',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header with Morrow Logo */}
      <header
        style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '28px',
          paddingTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4F46E5',
            }}
          />
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Morrow
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: '999px' }}>
            Spaces
          </span>
        </div>
      </header>

      {/* Hero Title */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: '680px',
          marginBottom: '24px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(26px, 5vw, 36px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#0F172A',
            marginBottom: '10px',
            lineHeight: 1.2,
          }}
        >
          What kind of meeting room do you need?
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#64748B',
            lineHeight: 1.5,
            margin: '0 auto',
            maxWidth: '520px',
          }}
        >
          Choose a layout to start instantly, or enter an existing space code below.
        </p>
      </div>

      {/* Quick Join Input Bar */}
      <form
        onSubmit={handleJoin}
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '999px',
          padding: '6px 8px 6px 16px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
          marginBottom: '36px',
        }}
      >
        <input
          type="text"
          placeholder="Enter space code or link..."
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '16px', // Prevents iOS Safari auto-zoom
            color: '#0F172A',
            backgroundColor: 'transparent',
          }}
        />
        <button
          type="submit"
          disabled={!roomInput.trim()}
          style={{
            padding: '8px 18px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: roomInput.trim() ? '#4F46E5' : '#E2E8F0',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: roomInput.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>Join</span>
          <ArrowRight size={14} />
        </button>
      </form>

      {/* 9 Authentic PopSpace Meeting Template Cards */}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '20px',
        }}
      >
        {TEMPLATES.map((tmpl) => {
          const isLoading = selectedTemplate === tmpl.id;

          return (
            <div
              key={tmpl.id}
              onClick={() => !selectedTemplate && handleSelectTemplate(tmpl.id)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                cursor: selectedTemplate ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (!selectedTemplate) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedTemplate) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }
              }}
            >
              {/* Card Illustration */}
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '14px',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={tmpl.image}
                  alt={tmpl.title}
                  style={{
                    maxHeight: '115px',
                    maxWidth: '85%',
                    objectFit: 'contain',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Card Info */}
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: '4px',
                  lineHeight: 1.3,
                }}
              >
                {tmpl.title}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748B',
                  lineHeight: 1.45,
                  margin: 0,
                  flex: 1,
                }}
              >
                {tmpl.description}
              </p>

              {/* Loading State Overlay */}
              {isLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    zIndex: 10,
                  }}
                >
                  <Loader2 size={24} className="animate-spin" color="#4F46E5" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                    Preparing executive space...
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
