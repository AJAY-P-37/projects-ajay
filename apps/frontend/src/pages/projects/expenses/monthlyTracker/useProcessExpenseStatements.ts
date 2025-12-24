import { useMutation } from "@tanstack/react-query";
import ExpensesService from "@/services/ExpensesService";
import { FirebaseService } from "@/services/FirebaseService";
import { IProcessExpenseFileRequest } from "common-types/types/expenses";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { AuthError, isAuthError } from "@/services/Service";

export interface StatementResult {
  type: string;
  success: boolean;
  error?: string;
  processedData?: any[];
}

export const useProcessExpenseStatements = () => {
  const expensesService = new ExpensesService();

  return useMutation({
    mutationFn: async ({
      month,
      year,
      userEmail,
      statements,
    }: {
      month: number;
      year: number;
      userEmail: string;
      statements: {
        type: string;
        file: File[];
      }[];
    }) => {
      const results: StatementResult[] = [];
      const consolidatedData: any[] = [];

      await Promise.all(
        statements.map(async (statement) => {
          let uploadedFiles: any[] | undefined;

          try {
            uploadedFiles = await FirebaseService.uploadFilesToFirebase(
              statement.file,
              `expenses/${userEmail}/statements`,
            );

            const data = await expensesService.processMonthlyExpenseStatements({
              month,
              year,
              statementType: statement.type,
              statementFilesMetadata: uploadedFiles,
            } as IProcessExpenseFileRequest);

            if (data?.processedData?.length) {
              consolidatedData.push(...data.processedData);
            }

            results.push({
              type: statement.type,
              success: true,
              processedData: data.processedData,
            });
            Toast.success(`Processed ${statement.type} statement`);
          } catch (err: any) {
            results.push({
              type: statement.type,
              success: false,
              error: err.message || "Processing failed",
            });
            if (isAuthError(err)) throw new AuthError();
            Toast.error(`Error in ${statement.type}: ${err.message || "Processing failed"}`);
          } finally {
            if (uploadedFiles) {
              await Promise.all(
                uploadedFiles.map((f) => FirebaseService.deleteFileFromStorage(f.fullPath)),
              );
            }
          }
        }),
      );

      return {
        consolidatedData,
        results,
      };
    },
  });
};
