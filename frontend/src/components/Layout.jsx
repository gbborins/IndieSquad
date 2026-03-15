import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
