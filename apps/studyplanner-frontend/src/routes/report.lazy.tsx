import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/report')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/report"!</div>;
}
