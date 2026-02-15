import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/exam')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/exam"!</div>;
}
