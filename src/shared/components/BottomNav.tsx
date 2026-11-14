import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/maintenance', label: '정비', icon: '🔧' },
  { to: '/compliance', label: '검사·보험', icon: '🛡️' },
  { to: '/settings', label: '설정', icon: '⚙️' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav" aria-label="하단 메인 내비게이션">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav-link touch-target${isActive ? ' active' : ''}`
          }
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
