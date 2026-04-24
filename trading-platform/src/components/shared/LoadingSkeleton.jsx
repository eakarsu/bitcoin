import { Box, Card, CardContent, Skeleton, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

// Dashboard stats cards skeleton
export const StatsCardSkeleton = ({ count = 4 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={6} md={3} key={i}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="80%" height={40} sx={{ my: 1 }} />
            <Skeleton variant="text" width="40%" height={20} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Table skeleton
export const TableSkeleton = ({ rows = 8, columns = 6 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton variant="text" width="80%" height={24} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton variant="text" width={`${60 + Math.random() * 30}%`} height={20} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 350 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="25%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
    </CardContent>
  </Card>
);

// Profile page skeleton
export const ProfileSkeleton = () => (
  <Box sx={{ maxWidth: 800, mx: 'auto' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 3 }}>
      <Skeleton variant="circular" width={80} height={80} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="30%" height={20} />
      </Box>
    </Box>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Skeleton variant="text" width="20%" height={28} sx={{ mb: 2 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        ))}
      </CardContent>
    </Card>
  </Box>
);

// Card list skeleton
export const CardListSkeleton = ({ count = 6 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="60%" height={24} />
            </Box>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Full page skeleton
export const PageSkeleton = () => (
  <Box sx={{ p: 4 }}>
    <Skeleton variant="text" width="30%" height={48} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="50%" height={24} sx={{ mb: 4 }} />
    <StatsCardSkeleton />
    <Box sx={{ mt: 4 }}>
      <ChartSkeleton />
    </Box>
    <Box sx={{ mt: 4 }}>
      <TableSkeleton />
    </Box>
  </Box>
);

export default PageSkeleton;
