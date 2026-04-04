import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Home: React.FC = () => {
  const features = [
    {
      icon: <Truck className="h-8 w-8 text-primary-600" />,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: 'Secure Payment',
      description: 'Your payment information is safe and secure'
    },
    {
      icon: <RotateCcw className="h-8 w-8 text-primary-600" />,
      title: 'Easy Returns',
      description: '30-day return policy for all items'
    }
  ];

  const categories = [
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', count: 25 },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400', count: 18 },
    { name: 'Sports', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', count: 12 },
    { name: 'Appliances', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', count: 8 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Our
              <span className="block text-primary-200">E-commerce Store</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Discover amazing products at unbeatable prices. Shop with confidence and enjoy fast, secure delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/categories">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              We provide exceptional service and quality products to make your shopping experience unforgettable.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Explore our wide range of product categories and find exactly what you're looking for.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="relative">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <h3 className="text-xl font-semibold mb-2">
                          {category.name}
                        </h3>
                        <p className="text-sm opacity-90">
                          {category.count} products
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover amazing products at great prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
