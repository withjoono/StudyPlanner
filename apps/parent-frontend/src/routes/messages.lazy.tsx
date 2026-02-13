/**
 * 학부모 쪽지 페이지
 */
import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageSquare, Send, User, CheckCheck, Clock } from 'lucide-react';

export const Route = createLazyFileRoute('/messages')({
  component: ParentMessagesPage,
});

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    teacherName: '김멘토',
    subject: '수학',
    lastMessage: '다음 주 모의고사 준비 잘 부탁드립니다.',
    timestamp: '14:30',
    unread: 2,
    studentName: '김민수',
  },
  {
    id: 2,
    teacherName: '이멘토',
    subject: '영어',
    lastMessage: '영어 단어 암기 잘 하고 있어요!',
    timestamp: '어제',
    unread: 0,
    studentName: '김민수',
  },
  {
    id: 3,
    teacherName: '박멘토',
    subject: '국어',
    lastMessage: '비문학 문제 풀이 방법 안내드립니다',
    timestamp: '2일 전',
    unread: 0,
    studentName: '김수진',
  },
];

const MOCK_MESSAGES = [
  { id: 1, senderId: 100, senderName: '김멘토', content: '수학 숙제 잘 했어요! 다음엔 증명 문제도 도전해봐요.', time: '14:30', isMe: false },
  { id: 2, senderId: 0, senderName: '나', content: '감사합니다, 선생님! 추가 문제 추천해주실 수 있나요?', time: '14:35', isMe: true },
  { id: 3, senderId: 100, senderName: '김멘토', content: '네, 미적분 심화 문제집 3장부터 풀어보세요.', time: '14:38', isMe: false },
  { id: 4, senderId: 100, senderName: '김멘토', content: '다음 주 모의고사 준비 잘 부탁드립니다.', time: '15:00', isMe: false },
];

function ParentMessagesPage() {
  const [selectedConvo, setSelectedConvo] = useState(MOCK_CONVERSATIONS[0]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-screen-xl gap-0 px-4 py-6 md:gap-4">
      {/* 대화 목록 */}
      <div className="w-full flex-shrink-0 overflow-y-auto rounded-xl bg-white shadow-sm md:w-80">
        <div className="border-b p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            쪽지
          </h2>
        </div>
        <div className="divide-y">
          {MOCK_CONVERSATIONS.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setSelectedConvo(convo)}
              className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                selectedConvo.id === convo.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-bold text-white">
                {convo.teacherName.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{convo.teacherName}</span>
                  <span className="text-xs text-gray-400">{convo.timestamp}</span>
                </div>
                <p className="text-xs text-gray-500">{convo.subject} · {convo.studentName}</p>
                <p className="mt-0.5 truncate text-sm text-gray-600">{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {convo.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 대화 내용 */}
      <div className="hidden flex-1 flex-col rounded-xl bg-white shadow-sm md:flex">
        {/* 대화 헤더 */}
        <div className="flex items-center gap-3 border-b p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-bold text-white">
            {selectedConvo.teacherName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{selectedConvo.teacherName}</h3>
            <p className="text-xs text-gray-500">{selectedConvo.subject} · {selectedConvo.studentName}</p>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                msg.isMe
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                  msg.isMe ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  <Clock className="h-2.5 w-2.5" />
                  {msg.time}
                  {msg.isMe && <CheckCheck className="h-3 w-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 입력창 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="쪽지를 입력하세요..."
              className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onKeyDown={(e) => e.key === 'Enter' && setNewMessage('')}
            />
            <button
              onClick={() => setNewMessage('')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
