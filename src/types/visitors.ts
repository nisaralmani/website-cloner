export interface Visitor {
  id: string;
  name: string;
  initials?: string;
  city: string;
  location: string;
  country: string;
  currentPage: string;
  isActive: boolean;
  avatarGradient: string;
  latitude: number;
  longitude: number;
  conversationId?: string | null;
}

export interface VisitorStats {
  online: number;
  active: number;
}
