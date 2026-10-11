import { useEffect, useState } from 'react';
import { classService } from '../services/class.service';

export interface ClassOption {
  value: string; // tên ngắn, vd "10A1"
  label: string;
  gradeLevel: number;
}

export const useClassOptions = () => {
  const [options, setOptions] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    classService
      .getClasses()
      .then((classes) => {
        if (cancelled) return;
        setOptions(
          classes
            .map((c) => {
              const shortName = c.className.replace(/^Lớp\s+/i, '').trim();
              return {
                value: shortName,
                label: `${shortName} (Khối ${c.gradeLevel})`,
                gradeLevel: Number(c.gradeLevel),
              };
            })
            .filter((o) => o.value),
        );
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, isLoading };
};