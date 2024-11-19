import { useState } from "react";
import axios from "axios";

interface InputFormProps {
  addWallpaper: (wallpaper: { prompt: string; imageUrl: string }) => void;
}

const InputForm: React.FC<InputFormProps> = ({ addWallpaper }) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // 开始加载状态
    try {
      // 调用后端 API，生成图片并上传到 R2 储存桶
      const response = await axios.post<{ r2ImageUrl: string }>(
        "/api/generate-wallpaper",
        { prompt }
      );

      const { r2ImageUrl } = response.data;

      // 将 R2 储存桶中的图片链接和提示词添加到页面
      addWallpaper({ prompt, imageUrl: r2ImageUrl });

      // 清空输入框
      setPrompt("");
    } catch (error) {
      console.error("Error generating wallpaper:", error);
      alert("Failed to generate wallpaper. Please try again.");
    } finally {
      setIsLoading(false); // 加载结束状态
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
        className="w-full max-w-lg p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className={`px-6 py-3 font-semibold rounded-lg ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
        }`}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
};

export default InputForm;