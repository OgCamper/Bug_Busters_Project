export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Bug Busters Study App</h1>
      <div className="flex flex-col space-y-3 w-64">
        <input type="email" placeholder="Email" className="border p-2 rounded" />
        <input type="password" placeholder="Password" className="border p-2 rounded" />
        <button className="bg-gray-200 text-gray-800 font-semibold">Login</button>
        <button className="bg-gray-200 text-gray-800 font-semibold">Sign Up</button>
      </div>
    </div>
  );
}
