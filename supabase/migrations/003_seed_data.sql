-- SpareCarry Seed Data
-- This migration populates the database with initial test data
-- Uses ON CONFLICT DO NOTHING to prevent duplicates on re-run

-- Insert 5 users (2 travelers, 2 requesters, 1 admin)
INSERT INTO users (id, email, role, display_name, avatar_url) VALUES
    ('00000000-0000-0000-0000-000000000001', 'traveler1@sparecarry.com', 'traveler', 'John Traveler', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
    ('00000000-0000-0000-0000-000000000002', 'traveler2@sparecarry.com', 'traveler', 'Sarah Explorer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
    ('00000000-0000-0000-0000-000000000003', 'requester1@sparecarry.com', 'requester', 'Mike Requester', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'),
    ('00000000-0000-0000-0000-000000000004', 'requester2@sparecarry.com', 'requester', 'Emma Sender', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'),
    ('00000000-0000-0000-0000-000000000005', 'admin@sparecarry.com', 'admin', 'Admin User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert 3 trips (mixed plane/boat)
INSERT INTO trips (id, user_id, type, origin, destination, departure_date, arrival_date) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'plane', 'New York, NY', 'Los Angeles, CA', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '6 hours'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'boat', 'Miami, FL', 'Nassau, Bahamas', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 days'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'plane', 'Chicago, IL', 'Miami, FL', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Insert 5 requests
INSERT INTO requests (id, trip_id, title, description, item_category, status, reward_amount) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Deliver Electronics Package', 'Small package containing electronics, needs careful handling', 'Electronics', 'open', 150.00),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Ship Documents', 'Important business documents, time-sensitive', 'Documents', 'matched', 75.00),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Deliver Artwork', 'Framed artwork, requires careful packaging', 'Art', 'open', 300.00),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Send Clothing Package', 'Box of clothing items, lightweight', 'Clothing', 'open', 50.00),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Deliver Medical Supplies', 'Temperature-controlled medical supplies', 'Medical', 'completed', 200.00)
ON CONFLICT DO NOTHING;

-- Insert 3 matches (various statuses)
INSERT INTO matches (id, request_id, traveler_id, status) VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'chatting'),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'delivered'),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'pending')
ON CONFLICT DO NOTHING;

-- Insert 10 messages spread across matches
INSERT INTO messages (id, match_id, sender_id, body) VALUES
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hi! I can help deliver your documents. When do you need them?'),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Great! I need them by next Friday. Is that possible?'),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Yes, absolutely! I can deliver them on Thursday.'),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Perfect! Where should we meet?'),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Package delivered successfully!'),
    ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Thank you so much! Everything arrived in perfect condition.'),
    ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'I saw your request for electronics delivery. I can help!'),
    ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'That would be amazing! What are the details?'),
    ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'I have space in my carry-on. The package should be small.'),
    ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Perfect! It is a small package, about 2kg.')
ON CONFLICT DO NOTHING;

-- Insert 1 dispute (linked to a match)
INSERT INTO disputes (id, match_id, opened_by, reason, status) VALUES
    ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Package was damaged during delivery', 'open')
ON CONFLICT DO NOTHING;

-- Insert 3 payments (linked to matches)
INSERT INTO payments (id, match_id, stripe_payment_intent, amount, status) VALUES
    ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'pi_test_1234567890', 75.00, 'pending'),
    ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'pi_test_0987654321', 200.00, 'succeeded'),
    ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'pi_test_1122334455', 150.00, 'pending')
ON CONFLICT DO NOTHING;

