"use client";
import { Component } from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { ErrorOutline, Refresh } from "@mui/icons-material";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }

        // You can also log the error to an error reporting service here
        // Example: logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Optionally reload the page
        if (this.props.resetOnReload) {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleReset);
            }

            // Default fallback UI
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="400px"
                    p={3}
                >
                    <Card sx={{ maxWidth: 600, width: "100%" }}>
                        <CardContent sx={{ textAlign: "center", p: 4 }}>
                            <ErrorOutline
                                sx={{
                                    fontSize: 64,
                                    color: "error.main",
                                    mb: 2,
                                }}
                            />
                            <Typography variant="h5" gutterBottom fontWeight="bold">
                                خطایی رخ داده است
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                            >
                                متأسفانه مشکلی در نمایش این بخش پیش آمده است. لطفاً صفحه را
                                رفرش کنید یا دوباره تلاش کنید.
                            </Typography>

                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <Box
                                    sx={{
                                        mt: 3,
                                        p: 2,
                                        bgcolor: "error.light",
                                        borderRadius: 1,
                                        textAlign: "left",
                                    }}
                                >
                                    <Typography variant="caption" component="pre" sx={{ fontSize: "0.75rem" }}>
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </Typography>
                                </Box>
                            )}

                            <Box display="flex" gap={2} justifyContent="center" mt={3}>
                                <Button
                                    variant="contained"
                                    startIcon={<Refresh />}
                                    onClick={this.handleReset}
                                >
                                    تلاش مجدد
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => (window.location.href = "/dashboard")}
                                >
                                    بازگشت به داشبورد
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

