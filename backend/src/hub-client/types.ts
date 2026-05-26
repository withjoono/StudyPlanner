export type HubGroupType = 'teacher' | 'study' | 'aim_univ';

export interface HubGroup {
  id: string;
  name: string;
  groupType: HubGroupType;
  sourceApp?: string | null;
  grade?: string | null;
  memberCount?: number;
  isOwner?: boolean;
}

export interface HubMember {
  hubUserId: string;
  nickname: string;
  profileImageUrl?: string | null;
  role?: string | null;
}
