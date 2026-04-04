import Dashboard from "./Dashboard";
import type { Transaction, Budget, Profile } from "../utils";

export default function SeniorDashboard(props: {
  transactions: Transaction[];
  budgets: Budget[];
  currentMonth: string;
  profile: Profile | null;
}) {
  // シニア向けにpropsをそのまま渡す。必要ならカスタマイズ可
  return <Dashboard {...props} seniorMode />;
}
