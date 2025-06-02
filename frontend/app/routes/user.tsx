import type { Route } from "./+types/user";

export async function loader({ params }: Route.LoaderArgs) {
  // Simulate user fetch
  const user = { id: params.id, name: `User ${params.id}` };
  return { user };
}

export default function User({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>User: {loaderData.user.name}</h1>
      <p>User ID: {loaderData.user.id}</p>
    </div>
  );
}