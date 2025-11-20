-- SpareCarry Row Level Security Policies
-- This migration creates all RLS policies for secure data access

-- Users table policies
-- Users can read/update their own row
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Admins can read/write all users
CREATE POLICY "Admins can manage all users"
    ON users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trips table policies
-- Users can read their own trips
CREATE POLICY "Users can read own trips"
    ON trips FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own trips
CREATE POLICY "Users can create own trips"
    ON trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update own trips"
    ON trips FOR UPDATE
    USING (auth.uid() = user_id);

-- Travelers can read trips for requests they are associated with
CREATE POLICY "Travelers can read associated trips"
    ON trips FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            JOIN requests r ON r.id = m.request_id
            WHERE m.traveler_id = auth.uid()
            AND r.trip_id = trips.id
        )
    );

-- Admins can manage all trips
CREATE POLICY "Admins can manage all trips"
    ON trips FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Requests table policies
-- Users can read all open requests
CREATE POLICY "Users can read open requests"
    ON requests FOR SELECT
    USING (status = 'open');

-- Users can read requests for trips they are associated with
CREATE POLICY "Users can read associated requests"
    ON requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.request_id = requests.id
            AND (m.traveler_id = auth.uid() OR EXISTS (
                SELECT 1 FROM trips t
                JOIN requests r ON r.trip_id = t.id
                WHERE r.id = requests.id AND t.user_id = auth.uid()
            ))
        )
    );

-- Users can create requests
CREATE POLICY "Users can create requests"
    ON requests FOR INSERT
    WITH CHECK (true);

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
    ON requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trips t
            WHERE t.id = requests.trip_id
            AND t.user_id = auth.uid()
        )
    );

-- Admins can manage all requests
CREATE POLICY "Admins can manage all requests"
    ON requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Matches table policies
-- Users can read matches they are involved in
CREATE POLICY "Users can read own matches"
    ON matches FOR SELECT
    USING (
        traveler_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM requests r
            JOIN trips t ON t.id = r.trip_id
            WHERE r.id = matches.request_id
            AND t.user_id = auth.uid()
        )
    );

-- Travelers can create matches
CREATE POLICY "Travelers can create matches"
    ON matches FOR INSERT
    WITH CHECK (traveler_id = auth.uid());

-- Users can update matches they are involved in
CREATE POLICY "Users can update own matches"
    ON matches FOR UPDATE
    USING (
        traveler_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM requests r
            JOIN trips t ON t.id = r.trip_id
            WHERE r.id = matches.request_id
            AND t.user_id = auth.uid()
        )
    );

-- Admins can manage all matches
CREATE POLICY "Admins can manage all matches"
    ON matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Messages table policies
-- Users can read messages for matches they are involved in
CREATE POLICY "Users can read own messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (
                m.traveler_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM requests r
                    JOIN trips t ON t.id = r.trip_id
                    WHERE r.id = m.request_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- Users can create messages for matches they are involved in
CREATE POLICY "Users can create messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (
                m.traveler_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM requests r
                    JOIN trips t ON t.id = r.trip_id
                    WHERE r.id = m.request_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
    ON messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Disputes table policies
-- Users can read disputes they are involved in
CREATE POLICY "Users can read own disputes"
    ON disputes FOR SELECT
    USING (
        opened_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = disputes.match_id
            AND (
                m.traveler_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM requests r
                    JOIN trips t ON t.id = r.trip_id
                    WHERE r.id = m.request_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- Users can create disputes for matches they are involved in
CREATE POLICY "Users can create disputes"
    ON disputes FOR INSERT
    WITH CHECK (
        opened_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = disputes.match_id
            AND (
                m.traveler_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM requests r
                    JOIN trips t ON t.id = r.trip_id
                    WHERE r.id = m.request_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- Admins can manage all disputes
CREATE POLICY "Admins can manage all disputes"
    ON disputes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payments table policies
-- Users can read payments for matches they are involved in
CREATE POLICY "Users can read own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = payments.match_id
            AND (
                m.traveler_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM requests r
                    JOIN trips t ON t.id = r.trip_id
                    WHERE r.id = m.request_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- Users can create payments for matches they are involved in
CREATE POLICY "Users can create payments"
    ON payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = payments.match_id
            AND (
                m.traveler_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM requests r
                    JOIN trips t ON t.id = r.trip_id
                    WHERE r.id = m.request_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
    ON payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

