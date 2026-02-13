/**
 * 선생님 쪽지 페이지
 */
import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageSquare, Send, Clock, CheckCheck } from 'lucide-react';

export const Route = createLazyFileRoute('/messages')({
  component: TeacherMessagesPage,
});

const MOCK_CONVERSATIONS = [
  { id: 1, name: '김학부모', studentName: '김민수', lastMessage: '다음 주 모의고사 범위 알 수 있을까요?', timestamp: '14:30', unread: 1 },
  { id: 2, name: '이학부모', studentName: '이수진', lastMessage: '아이가 집에서도 열심히 하고 있어요', timestamp: '어제', unread: 0 },
  { id: 3, name: '박학부모', studentName: '박지영', lastMessage: '영어 과외 시간 변경 가능할까요?', timestamp: '2일 전', unread: 0 },
];

const MOCK_MESSAGES = [
  { id: 1, content: '선생님, 다음 주 모의고사 범위 알 수 있을까요?', time: '14:30', isMe: false },
  { id: 2, content: '네, 수학 미적분 1~3단원입니다.', time: '14:35', isMe: true },
  { id: 3, content: '민수가 최근 좀 힘들어하는 것 같아서요.', time: '14:38', isMe: false },
  { id: 4, content: '미적분 기초 부분 보강이 필요해 보여요. 과제를 조금 조정해드릴게요.', time: '14:40', isMe: true },
];

function TeacherMessagesPage() {
  const [selectedConvo, setSelectedConvo] = useState(MOCK_CONVERSATIONS[0]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-screen-xl gap-0 px-4 py-6 md:gap-4">
      {/* 대화 목록 */}
      <div className="w-full flex-shrink-0 overflow-y-auto rounded-xl bg-white shadow-sm md:w-80">
        <div className="border-b p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            쪽지
          </h2>
        </div>
        <div className="divide-y">
          {MOCK_CONVERSATIONS.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setSelectedConvo(convo)}
              className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                selectedConvo.id === convo.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                {convo.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{convo.name}</span>
                  <span className="text-xs text-gray-400">{convo.timestamp}</span>
                </div>
                <p className="text-xs text-gray-500">학생: {convo.studentName}</p>
                <p className="mt-0.5 truncate text-sm text-gray-600">{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {convo.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 대화 내용 */}
      <div className="hidden flex-1 flex-col rounded-xl bg-white shadow-sm md:flex">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
            {selectedConvo.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{selectedConvo.name}</h3>
            <p className="text-xs text-gray-500">학생: {selectedConvo.studentName}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                msg.isMe
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                  msg.isMe ? 'text-emerald-100' : 'text-gray-400'
                }`}>
                  <Clock className="h-2.5 w-2.5" />
                  {msg.time}
                  {msg.isMe && <CheckCheck className="h-3 w-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="쪽지를 입력하세요..."
              className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              onKeyDown={(e) => e.key === 'Enter' && setNewMessage('')}
            />
            <button
              onClick={() => setNewMessage('')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
