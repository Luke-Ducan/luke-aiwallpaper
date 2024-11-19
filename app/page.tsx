"use client";

import { useState } from "react";

interface Wallpaper {
  prompt: string;
  imageUrl: string;
}

export default function Page() {
  const [prompt, setPrompt] = useState<string>("");
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-wallpaper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data: { imageUrl: string } = await response.json();
      setWallpapers([{ prompt, imageUrl: data.imageUrl }, ...wallpapers]);
      setPrompt("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}

      {/* Main Content */}
      <main className="flex-1 p-4">
        {/* Input Form */}
        <form onSubmit={handleGenerate} className="mb-6 text-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt"
            className="p-2 border border-gray-300 rounded w-3/4 max-w-md"
            required
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded ml-2"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </form>

        {/* Generated Wallpapers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallpapers.map((wallpaper, index) => (
            <div
              key={index}
              className="p-4 border border-gray-300 rounded bg-white shadow"
            >
              <img
                src={wallpaper.imageUrl}
                alt={wallpaper.prompt}
                className="w-full h-48 object-cover mb-2"
              />
              <p className="text-sm text-gray-700">{wallpaper.prompt}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>© 2024 AI Wallpaper Generator. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
