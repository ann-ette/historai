import { HistoricalFigure } from "@/types";

export const historicalFigures: HistoricalFigure[] = [
  {
    id: "einstein",
    name: "ALBERT EINSTEIN",
    imageSrc: "https://res.cloudinary.com/dorfwjwze/image/upload/v1747107248/Half-body_Portrait_Of_A_Young_Man_With_Pompadour_Hair_frdcy2.png",
    videoSrc: "https://res.cloudinary.com/dorfwjwze/video/upload/v1747108225/2d1125d6-a320-49b5-8bcd-f5d8836f9c45_d9aajf.mp4",
    isActive: true
  },
  {
    id: "aurelius",
    name: "MARCUS AURELIUS",
    imageSrc: "https://res.cloudinary.com/dorfwjwze/image/upload/v1747150507/Realistic_Digital_Portrait_of_an_Older_Man_Resembling_Marcus_Aurelius_fbu2wj.png",
    isActive: false
  },
  {
    id: "curie",
    name: "MARIE CURIE",
    imageSrc: "https://res.cloudinary.com/dorfwjwze/image/upload/v1747149812/MarietCurie_purryw.jpg",
    isActive: false
  },
  {
    id: "lincoln",
    name: "ABRAHAM LINCOLN",
    imageSrc: "https://res.cloudinary.com/dorfwjwze/image/upload/v1747149919/artbreeder-poser_3_qzyzgw.jpg",
    isActive: false
  }
];

export const getHistoricalFigureById = (id: string): HistoricalFigure | undefined => {
  return historicalFigures.find(figure => figure.id === id);
};

export const getActiveHistoricalFigure = (): HistoricalFigure => {
  return historicalFigures.find(figure => figure.isActive) || historicalFigures[0];
};
