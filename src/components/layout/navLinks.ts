export interface NavLink {
  href: string;
  label: string;
  disabled?: boolean;
}

/**
 * The primary navigation, shared by the desktop strip and the mobile slide-over
 * so the two can't drift apart.
 *
 * Help is only offered to signed-in visitors: the help centre lives under
 * /dashboard, so showing it signed out would be a link that dead-ends at the
 * login page — the same problem the bottom nav had.
 */
export function primaryNavLinks(isLoggedIn: boolean): NavLink[] {
  return [
    { href: "/", label: "Home" },
    { href: "/stores", label: "Stores" },
    { href: "/share-earn", label: "Share & Earn" },
    // The public pitch, not /dashboard/refer — a signed-out visitor clicking
    // this should land on the offer, not a login wall. The public page links
    // signed-in users through to their dashboard view.
    { href: "/refer-earn", label: "Refer & Earn" },
    { href: "#", label: "Deals", disabled: true },
    ...(isLoggedIn
      ? [{ href: "/dashboard/help", label: "Help" }]
      : [{ href: "#", label: "Help", disabled: true }]),
  ];
}

/**
 * The signed-in visitor's own pages.
 *
 * Kept separate from the primary links because the mobile menu shows both as
 * distinct groups: browsing the site and managing your account are different
 * intents, and merging them into one flat list is what made the panel feel
 * disconnected from the rest of the site.
 */
export function accountNavLinks(): NavLink[] {
  return [
    { href: "/dashboard/activity", label: "My Activity" },
    { href: "/dashboard/wallet", label: "My Wallet" },
    { href: "/dashboard/orders", label: "Orders" },
    { href: "/dashboard/claims", label: "Cashback Claims" },
    { href: "/share-earn", label: "Profit Links" },
    { href: "/dashboard/go-links", label: "goURL" },
    { href: "/dashboard/refer", label: "Refer & Earn" },
    { href: "/dashboard/profile", label: "Profile & Settings" },
    { href: "/dashboard/help", label: "Help & Support" },
  ];
}
