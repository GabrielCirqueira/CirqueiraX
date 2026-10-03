import { Container } from '@chakra-ui/react'
import * as React from 'react'

export interface AppContainerProps {
  children: React.ReactNode
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg'
  paddingY?: '0' | '4' | '6' | '8' | '12' | '16'
  paddingX?: '0' | '4' | '6' | '8' | '12'
  centered?: boolean
}

export const AppContainer = React.forwardRef<HTMLDivElement, AppContainerProps>(
  ({ children, maxWidth = 'full', paddingY = '8', paddingX = '6', centered = true }, ref) => (
    <Container
      ref={ref}
      w="full"
      maxW={maxWidth === 'full' ? '100%' : maxWidth}
      py={paddingY}
      px={paddingX}
      mx={centered ? 'auto' : undefined}
    >
      {children}
    </Container>
  )
)

AppContainer.displayName = 'AppContainer'
