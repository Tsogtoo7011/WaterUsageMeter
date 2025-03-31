import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';

const VerifyEmail = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('Имэйл хаягийг баталгаажуулж байна...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setVerifying(false);
        setMessage('Баталгаажуулах токен олдсонгүй');
        return;
      }

      try {
        const response = await axios.get(`/api/auth/verify-email?token=${token}`);
        
        // Store the new token that comes back after verification
        if (response.data.token) {
          localStorage.setItem('userToken', response.data.token);
        }
        
        setVerifying(false);
        setSuccess(true);
        setMessage(response.data.message || 'Имэйл хаяг амжилттай баталгаажлаа');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setVerifying(false);
        setMessage(error.response?.data?.message || 'Баталгаажуулах үед алдаа гарлаа');
      }
    };

    verifyEmail();
  }, [location, navigate]);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header>Имэйл баталгаажуулах</Card.Header>
            <Card.Body className="text-center">
              {verifying ? (
                <div>
                  <Spinner animation="border" role="status" />
                  <p className="mt-3">Уншиж байна...</p>
                </div>
              ) : (
                <>
                  <Alert variant={success ? "success" : "danger"}>
                    {message}
                  </Alert>
                  {success && <p>Нэвтрэх хуудас руу шилжүүлж байна...</p>}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifyEmail;