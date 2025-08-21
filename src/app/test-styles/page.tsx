export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Apple-Style CSS Test
        </h1>

        {/* Test Apple Container */}
        <div className="apple-container bg-white p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">Apple Container Test</h2>
          <p>This should have proper padding and max-width constraints.</p>
        </div>

        {/* Test Apple Card */}
        <div className="apple-card p-6">
          <h2 className="text-2xl font-semibold mb-4">Apple Card Test</h2>
          <p>This should have rounded corners, shadow, and hover effects.</p>
        </div>

        {/* Test Apple Button */}
        <button className="apple-button bg-blue-600 text-white px-6 py-3 rounded-lg">
          Apple Button Test
        </button>

        {/* Test Apple Badge */}
        <div className="space-y-4">
          <span className="apple-badge apple-badge-primary">Primary Badge</span>
          <span className="apple-badge apple-badge-success">Success Badge</span>
          <span className="apple-badge apple-badge-warning">Warning Badge</span>
          <span className="apple-badge apple-badge-danger">Danger Badge</span>
        </div>

        {/* Test Apple Input */}
        <input
          type="text"
          placeholder="Apple Input Test"
          className="apple-input w-full"
        />

        {/* Test Apple Text Gradient */}
        <h2 className="apple-text-gradient text-3xl font-bold text-center">
          Gradient Text Test
        </h2>

        {/* Test Apple Text Muted */}
        <p className="apple-text-muted text-center">
          This text should be muted and properly colored.
        </p>

        {/* Test Apple Responsive Classes */}
        <div className="space-y-4">
          <h3 className="apple-responsive-heading">Responsive Heading</h3>
          <p className="apple-responsive-text">Responsive Text</p>
        </div>

        {/* Test Apple Grid */}
        <div className="apple-grid-3">
          <div className="bg-gray-100 p-4 rounded">Grid Item 1</div>
          <div className="bg-gray-100 p-4 rounded">Grid Item 2</div>
          <div className="bg-gray-100 p-4 rounded">Grid Item 3</div>
        </div>

        {/* Test Apple Progress */}
        <div className="space-y-2">
          <div className="apple-progress">
            <div className="apple-progress-bar" style={{ width: "75%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
