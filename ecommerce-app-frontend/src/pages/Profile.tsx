import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      country: user?.country || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsLoading(true);
      const response = await authAPI.updateProfile(data);
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                  {user.isAdmin && (
                    <span className="inline-block mt-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last updated:</span>
                    <span className="font-medium">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        {...register('firstName', {
                          required: 'First name is required',
                          minLength: {
                            value: 2,
                            message: 'First name must be at least 2 characters',
                          },
                        })}
                        type="text"
                        label="First Name"
                        disabled={!isEditing}
                        error={errors.firstName?.message}
                      />
                    </div>
                    <div>
                      <Input
                        {...register('lastName', {
                          required: 'Last name is required',
                          minLength: {
                            value: 2,
                            message: 'Last name must be at least 2 characters',
                          },
                        })}
                        type="text"
                        label="Last Name"
                        disabled={!isEditing}
                        error={errors.lastName?.message}
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      label="Email Address"
                      disabled={!isEditing}
                      error={errors.email?.message}
                    />
                  </div>

                  <div>
                    <Input
                      {...register('phone')}
                      type="tel"
                      label="Phone Number"
                      disabled={!isEditing}
                      error={errors.phone?.message}
                    />
                  </div>

                  <div>
                    <Input
                      {...register('address')}
                      type="text"
                      label="Address"
                      disabled={!isEditing}
                      error={errors.address?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Input
                        {...register('city')}
                        type="text"
                        label="City"
                        disabled={!isEditing}
                        error={errors.city?.message}
                      />
                    </div>
                    <div>
                      <Input
                        {...register('state')}
                        type="text"
                        label="State"
                        disabled={!isEditing}
                        error={errors.state?.message}
                      />
                    </div>
                    <div>
                      <Input
                        {...register('zipCode')}
                        type="text"
                        label="ZIP Code"
                        disabled={!isEditing}
                        error={errors.zipCode?.message}
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      {...register('country')}
                      type="text"
                      label="Country"
                      disabled={!isEditing}
                      error={errors.country?.message}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex space-x-4 pt-6 border-t border-gray-200">
                      <Button
                        type="submit"
                        loading={isLoading}
                        disabled={isLoading}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
