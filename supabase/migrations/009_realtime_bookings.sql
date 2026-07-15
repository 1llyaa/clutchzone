-- Enable realtime broadcasts for new bookings (admin live notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
