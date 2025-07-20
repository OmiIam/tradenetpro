import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using TradeNet.im, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. Trading Risks</h2>
            <p className="text-gray-600 mb-4">
              Trading involves substantial risk and is not suitable for all investors. Past performance is not indicative of future results.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Platform Availability</h2>
            <p className="text-gray-600 mb-4">
              While we strive to maintain continuous platform availability, we do not guarantee uninterrupted access to our services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              All content, features, and functionality on TradeNet.im are owned by us and are protected by copyright and other intellectual property laws.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              TradeNet.im shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of any changes.
            </p>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}