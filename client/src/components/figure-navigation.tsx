import { useConversation } from "@/context/conversation-context";
import { historicalFigures } from "@/data/historical-figures";

export function FigureNavigation() {
  const { currentFigureId, setCurrentFigureId } = useConversation();

  return (
    <aside className="fixed left-6 top-0 flex flex-col items-center justify-center h-full w-16 z-10">
      <div className="flex flex-col space-y-8">
        {historicalFigures.map((figure) => (
          <div key={figure.id} className="figure-item group relative">
            {/* Plain HTML/CSS tooltip that shows on hover */}
            <div className="tooltip absolute top-1/2 -translate-y-1/2 left-16 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/80 backdrop-blur-md px-4 py-2 rounded border border-white/10 text-white text-sm font-light tracking-wide whitespace-nowrap pointer-events-none uppercase">
              {figure.name}
            </div>
            
            {/* Plain HTML/CSS figure avatar with hover effect */}
            <button
              onClick={() => setCurrentFigureId(figure.id)}
              style={{ cursor: 'pointer' }}
              className={`
                figure-button
                focus:outline-none
                block w-[60px] h-[60px] rounded-full overflow-hidden 
                transition-all duration-300 hover:scale-110
                ${currentFigureId === figure.id
                  ? "ring-2 ring-white shadow-lg shadow-white/20 border-2 border-white/50"
                  : "opacity-70 hover:opacity-100 border border-white/30"
                }
              `}
            >
              <img
                src={figure.imageSrc}
                alt={figure.name}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
