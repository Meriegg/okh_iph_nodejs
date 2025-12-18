export type TUser = {
  id: string;
  username: string;
  email: string;
  password: string;

  permission_linkSubmission: number;
  permission_embedSubmission: number;
  permission_popupSubmission: number;
  permission_liveTvSubmission: number;
  verified: number;
  banned: number;

  role: "user" | "admin" | "moderator";

  linkOrder: number;
  embedOrder: number;

  label: string | null;

  created_at: Date;
};

export type TUserSession = {
  id: string;
  user_id: string;
  sessionHash: string;
  expires_at: Date;
  disabled: number;
}

export type TWebsiteConfig = {
  sizedAds: Record<string, {
    code: string;
    width: number;
    height: number;
  }>;
  footerScripts: string[];
  liveTvScripts: string[];
  playerPreStartAffiliateLink: string | null;
  adminNotice: string | null;
  domainConfig: Record<string, { name: string; specificSport: string | null }>;
  footerLinks: { name: string; href: string; applicableDomains: string | null }[];
  headContent: { code: string; applicableDomains: string | null }[];
  bodyContent: { code: string; applicableDomains: string | null }[];
}

export type TLiveTvChannel = {
  id: string;
  channelName: string;
  language: string;
  linksJson: string;
  channelImage: string;
  createdAt: Date;
  userId: string;
}