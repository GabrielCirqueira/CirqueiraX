import { Box, Button, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle } from 'lucide-react'
import * as React from 'react'

interface ErrorBoundaryProps {
  fallback?: React.ReactNode
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <VStack minH="200px" alignItems="center" justifyContent="center" gap={4} p={8} textAlign="center">
          <Box w={12} h={12} borderRadius="xl" bg="rose.500/10" display="flex" alignItems="center" justifyContent="center">
            <AlertTriangle size={24} color="#f43f5e" />
          </Box>
          <VStack gap={1}>
            <Text fontWeight="semibold" color="white">Algo deu errado</Text>
            <Text fontSize="sm" color="zinc.400">
              {this.state.error?.message ?? 'Erro inesperado'}
            </Text>
          </VStack>
          <Button
            size="sm"
            colorPalette="red"
            variant="subtle"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Tentar novamente
          </Button>
        </VStack>
      )
    }

    return this.props.children
  }
}
