import React, { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const MyAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await appointmentsAPI.getByUser();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { data } = await appointmentsAPI.cancel(id);
      if (data.success) {
        toast.success('Appointment cancelled');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-[#D4755B] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-fraunces text-gray-900 mb-8">My Appointments</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500 font-manrope">No appointments scheduled.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <li key={appointment._id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 font-manrope">{appointment.propertyId?.title}</h4>
                      <p className="text-sm text-gray-500 font-manrope mt-1">
                        <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()} | <strong>Time:</strong> {appointment.time}
                      </p>
                      <p className="text-sm w-[60%] text-gray-600 font-manrope mt-2">
                        {appointment.notes || "No additional notes."}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide
                        ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {appointment.status}
                      </span>
                      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <button onClick={() => handleCancel(appointment._id)} className="text-red-600 hover:underline text-sm font-manrope mt-1">
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppointmentsPage;
