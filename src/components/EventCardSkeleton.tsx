import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const EventCardSkeleton = () => (
  <Card className="overflow-hidden border-border/50">
    <Skeleton className="h-48 w-full rounded-none" />
    <CardHeader className="pb-2 pt-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-1/2 mt-1" />
    </CardHeader>
    <CardContent className="space-y-2 pb-0">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-1.5 w-full mt-2 rounded-full" />
    </CardContent>
    <CardFooter className="pt-4 pb-4">
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);

export default EventCardSkeleton;
