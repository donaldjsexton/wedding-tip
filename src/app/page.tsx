import Link from "next/link";
import { Heart, Users, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-pink-500 mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
              TipWedding
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simplify wedding vendor tipping for couples and coordinators. 
            Never wonder who to tip, how much, or how again.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Coordinator Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <Users className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                For Wedding Coordinators
              </h2>
              <p className="text-gray-600 mb-8">
                Set up personalized tipping experiences for your couples. 
                Manage vendors and create custom tip recommendations.
              </p>
              <Link 
                href="/coordinator/login" 
                className="inline-flex items-center justify-center w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Coordinator Sign In
              </Link>
            </div>
          </div>

          {/* Couple Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <CreditCard className="h-16 w-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                For Couples
              </h2>
              <p className="text-gray-600 mb-8">
                Access your personalized tipping guide with vendor details, 
                recommended amounts, and easy payment options.
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Have a wedding code?</p>
                  <input 
                    type="text" 
                    placeholder="Enter your wedding code..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <Link 
                  href="/couple/sample-wedding-abc123" 
                  className="inline-flex items-center justify-center w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  View Sample Wedding
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Setup</h4>
                <p className="text-sm text-gray-600">
                  Coordinator creates wedding profile with vendor details
                </p>
              </div>
              <div className="text-center">
                <div className="bg-pink-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-pink-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Review</h4>
                <p className="text-sm text-gray-600">
                  Couples review vendor list and tip recommendations
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Tip</h4>
                <p className="text-sm text-gray-600">
                  Pay tips digitally or get cash guidance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
