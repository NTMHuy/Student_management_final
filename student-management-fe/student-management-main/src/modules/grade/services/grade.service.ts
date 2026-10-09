import { StudentGradeRecord, GradeFiltersState } from "../types";
import { initialGradeRows, calculateAverage } from "../mocks/grade.mock";

let memoryGradeRows = [...initialGradeRows];

export const gradeService = {
  async getGradeRecords(
    filters?: Partial<GradeFiltersState>,
  ): Promise<StudentGradeRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...memoryGradeRows]);
      }, 150);
    });
  },

  async updateGrade(
    id: string,
    field: "tx1" | "tx2" | "tx3" | "gk" | "ck",
    value: number | null,
  ): Promise<StudentGradeRecord | null> {
    return new Promise((resolve) => {
      const idx = memoryGradeRows.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const item = memoryGradeRows[idx];
        const updatedItem = {
          ...item,
          [field]: value,
        };
        const { avg, rank } = calculateAverage(
          updatedItem.tx1,
          updatedItem.tx2,
          updatedItem.tx3,
          updatedItem.gk,
          updatedItem.ck,
        );
        updatedItem.avgScore = avg;
        updatedItem.rank = rank;
        memoryGradeRows[idx] = updatedItem;
        resolve(updatedItem);
      } else {
        resolve(null);
      }
    });
  },

  async saveAllGrades(records: StudentGradeRecord[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        memoryGradeRows = [...records];
        resolve(true);
      }, 400);
    });
  },
};
