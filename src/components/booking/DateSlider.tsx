import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, isSameDay, isBefore } from "date-fns";

interface DateSliderProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date) => void;
}

export function DateSlider({ selectedDate, onDateSelect }: DateSliderProps) {
  const today = new Date();
  const [startDate, setStartDate] = useState(today);
  const sliderRef = useRef<HTMLDivElement>(null);

  const dates = Array.from({ length: 12 }, (_, i) => addDays(startDate, i));

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -120, behavior: "smooth" });

      // Move startDate back, ensuring today is reintroduced
      const newStartDate = addDays(startDate, -1);
      if (!isBefore(newStartDate, today)) {
        setStartDate(newStartDate);
      } else {
        setStartDate(today); // Reset to today if scrolling too far back
      }
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 120, behavior: "smooth" });
      setStartDate(addDays(startDate, 1)); // Move to next date
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 w-full">
      <Button
        variant="outline"
        size="icon"
        className="hidden sm:flex"
        onClick={scrollLeft}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={sliderRef}
        className="flex gap-2 overflow-x-auto w-full max-w-md mx-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {dates.map((date) => (
          <div key={date.toISOString()} className="flex-shrink-0 w-[100px] snap-center">
            <Card
              className={`p-4 text-center cursor-pointer ${
                selectedDate && isSameDay(date, selectedDate)
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                onDateSelect(date);
              }}
              id={date.toISOString()}
            >
              <div className="text-sm font-medium">{format(date, "EEE")}</div>
              <div className="text-2xl font-bold">{format(date, "d")}</div>
              <div className="text-sm">{format(date, "MMM")}</div>
            </Card>
          </div>
        ))}
      </div>

      <Button variant="outline" size="icon" className="hidden sm:flex" onClick={scrollRight}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Hide scrollbar */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
}
