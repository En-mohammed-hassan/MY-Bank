import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Account } from "@/types";

export function AccountDetails({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account {account.account_number}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Ledger balance</dt><dd className="font-medium">{account.ledger_balance}</dd></div>
          <div><dt className="text-muted-foreground">Available</dt><dd className="font-medium">{account.available_balance}</dd></div>
          <div><dt className="text-muted-foreground">On hold</dt><dd className="font-medium">{account.hold_amount}</dd></div>
          <div><dt className="text-muted-foreground">Product</dt><dd className="font-medium">{account.product_category}</dd></div>
        </dl>
      </CardContent>
    </Card>
  );
}
