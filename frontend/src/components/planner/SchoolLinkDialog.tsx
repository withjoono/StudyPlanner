import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'geobuk-shared/ui';
import { Input } from 'geobuk-shared/ui';
import { useSearchSchools, useLinkSchool } from '@/stores/server/planner/school-schedule';

export function SchoolLinkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: schools, isLoading: isSearching } = useSearchSchools(query);
  const linkMutation = useLinkSchool();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>학교 연결</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            학교를 연결하면 시간표와 학교 행사가 플래너에 자동으로 표시됩니다.
          </p>
          <Input
            placeholder="학교명 입력 (2글자 이상)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              검색 중...
            </div>
          )}
          {schools && schools.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
              {schools.map((school) => (
                <button
                  key={school.schulCode}
                  type="button"
                  disabled={linkMutation.isPending}
                  onClick={() =>
                    linkMutation.mutate(school, { onSuccess: () => onOpenChange(false) })
                  }
                  className="flex w-full items-start gap-2.5 border-b border-gray-100 px-3 py-2.5 text-left last:border-0 hover:bg-sky-50 disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-800">{school.schulName}</div>
                    <div className="text-xs text-gray-400">
                      {school.schulKind}
                      {school.address ? ` · ${school.address}` : ''}
                    </div>
                  </div>
                  {linkMutation.isPending && (
                    <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-sky-500" />
                  )}
                </button>
              ))}
            </div>
          )}
          {schools?.length === 0 && query.length >= 2 && !isSearching && (
            <p className="text-center text-sm text-gray-400">검색 결과가 없습니다</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
