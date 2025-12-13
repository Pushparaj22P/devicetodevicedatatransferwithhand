export interface GestureTemplate {
  id: string;
  name: string;
  icon: string;
  points: { x: number; y: number }[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Pre-defined gesture templates with normalized coordinates (0-1 range)
export const gestureTemplates: GestureTemplate[] = [
  {
    id: 'star',
    name: 'Star',
    icon: '⭐',
    difficulty: 'medium',
    points: [
      { x: 0.5, y: 0 },
      { x: 0.62, y: 0.38 },
      { x: 1, y: 0.38 },
      { x: 0.69, y: 0.62 },
      { x: 0.81, y: 1 },
      { x: 0.5, y: 0.75 },
      { x: 0.19, y: 1 },
      { x: 0.31, y: 0.62 },
      { x: 0, y: 0.38 },
      { x: 0.38, y: 0.38 },
      { x: 0.5, y: 0 },
    ],
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: '❤️',
    difficulty: 'medium',
    points: generateHeartPoints(),
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: '⭕',
    difficulty: 'easy',
    points: generateCirclePoints(),
  },
  {
    id: 'check',
    name: 'Checkmark',
    icon: '✓',
    difficulty: 'easy',
    points: [
      { x: 0, y: 0.5 },
      { x: 0.35, y: 1 },
      { x: 1, y: 0 },
    ],
  },
  {
    id: 'triangle',
    name: 'Triangle',
    icon: '△',
    difficulty: 'easy',
    points: [
      { x: 0.5, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0.5, y: 0 },
    ],
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    icon: '⚡',
    difficulty: 'hard',
    points: [
      { x: 0.3, y: 0 },
      { x: 0.7, y: 0.25 },
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.75 },
      { x: 0.3, y: 1 },
    ],
  },
];

function generateCirclePoints(): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: 0.5 + 0.4 * Math.cos(angle),
      y: 0.5 + 0.4 * Math.sin(angle),
    });
  }
  return points;
}

function generateHeartPoints(): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    // Heart parametric equations
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    // Normalize to 0-1 range
    points.push({
      x: (x + 16) / 32,
      y: 1 - (y + 17) / 34,
    });
  }
  return points;
}

// Calculate similarity between user gesture and template
export function matchGestureToTemplate(
  userPoints: { x: number; y: number }[],
  template: GestureTemplate
): number {
  if (userPoints.length < 5) return 0;

  // Normalize user points
  const minX = Math.min(...userPoints.map((p) => p.x));
  const maxX = Math.max(...userPoints.map((p) => p.x));
  const minY = Math.min(...userPoints.map((p) => p.y));
  const maxY = Math.max(...userPoints.map((p) => p.y));
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const normalized = userPoints.map((p) => ({
    x: (p.x - minX) / rangeX,
    y: (p.y - minY) / rangeY,
  }));

  // Resample both to same number of points
  const sampleSize = 32;
  const resampledUser = resamplePoints(normalized, sampleSize);
  const resampledTemplate = resamplePoints(template.points, sampleSize);

  // Calculate distance
  let totalDistance = 0;
  for (let i = 0; i < sampleSize; i++) {
    const dx = resampledUser[i].x - resampledTemplate[i].x;
    const dy = resampledUser[i].y - resampledTemplate[i].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  const avgDistance = totalDistance / sampleSize;
  // Convert to similarity score (0-1, where 1 is perfect match)
  const similarity = Math.max(0, 1 - avgDistance * 2);
  
  return similarity;
}

function resamplePoints(
  points: { x: number; y: number }[],
  n: number
): { x: number; y: number }[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill(points[0]);

  // Calculate total path length
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }

  const interval = pathLength / (n - 1);
  const resampled: { x: number; y: number }[] = [points[0]];
  let dist = 0;
  let i = 1;

  while (resampled.length < n && i < points.length) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (dist + segmentLength >= interval) {
      const t = (interval - dist) / segmentLength;
      const newPoint = {
        x: points[i - 1].x + t * dx,
        y: points[i - 1].y + t * dy,
      };
      resampled.push(newPoint);
      points = [newPoint, ...points.slice(i)];
      i = 1;
      dist = 0;
    } else {
      dist += segmentLength;
      i++;
    }
  }

  // Fill remaining if needed
  while (resampled.length < n) {
    resampled.push(points[points.length - 1]);
  }

  return resampled;
}

export function findBestTemplateMatch(
  userPoints: { x: number; y: number }[]
): { template: GestureTemplate; similarity: number } | null {
  if (userPoints.length < 5) return null;

  let bestMatch: { template: GestureTemplate; similarity: number } | null = null;

  for (const template of gestureTemplates) {
    const similarity = matchGestureToTemplate(userPoints, template);
    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { template, similarity };
    }
  }

  return bestMatch && bestMatch.similarity > 0.5 ? bestMatch : null;
}
