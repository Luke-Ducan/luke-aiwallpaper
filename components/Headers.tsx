import { FaPaintBrush } from "react-icons/fa"; // Font Awesome 图标

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-center space-x-3">
        <FaPaintBrush className="text-2xl text-blue-400" />
        {/* 保持图标，不显示标题 */}
      </div>
    </header>
  );
};

export default Header;
