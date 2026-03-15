import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 24 }) {
  return (
    <img
      src={`${ICON_BASE}/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", filter: "invert(1)", flexShrink: 0 }}
    />
  );
}

const menuItems = [
  { label: "Guilda", icon: "monitor" },
  { label: "Quests", icon: "list" },
  { label: "NPCs", icon: "robot" },
  { label: "Memoria", icon: "brain" },
  { label: "Uso", icon: "coin" },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <PixelIcon name={mobileOpen ? "close" : "menu"} size={24} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        animate={{ width: expanded ? 220 : 68 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                className="sidebar-logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                Indie Squad
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <button key={idx} className="sidebar-link">
              <div className="sidebar-link-icon">
                <PixelIcon name={item.icon} size={22} />
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    className="sidebar-link-label"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.05 + idx * 0.02 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* Bottom area */}
        <div className="sidebar-bottom">
          {expanded && (
            <motion.button
              className="sidebar-signout"
              onClick={signOut}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              title="Sair"
            >
              <PixelIcon name="logout" size={16} />
              <span>Sair</span>
            </motion.button>
          )}
          <button className="sidebar-link sidebar-account">
            <div className="sidebar-link-icon account-avatar">
              <PixelIcon name="user" size={18} />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  className="sidebar-link-label"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
                  Conta
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
