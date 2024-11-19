interface Wallpaper {
  prompt: string;
  imageUrl: string;
}

const WallpaperCard: React.FC<{ wallpaper: Wallpaper }> = ({ wallpaper }) => {
  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <img
        src={wallpaper.imageUrl}
        alt={wallpaper.prompt}
        className="w-full h-48 object-cover rounded-lg mb-3"
      />
      <p className="text-base text-gray-800 font-medium">{wallpaper.prompt}</p>
    </div>
  );
};

export default WallpaperCard;
