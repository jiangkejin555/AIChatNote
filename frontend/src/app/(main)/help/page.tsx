'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Star, ThumbsUp, MessageSquare, Send, History, HelpCircle, Sparkles, Rocket, CheckCircle, Lightbulb } from 'lucide-react'
import { feedbackApi, SatisfactionRating, Feedback, FeatureRequest } from '@/lib/api/feedback'
import { toast } from 'sonner'

export default function HelpFeedbackPage() {
  const t = useTranslations()
  const [activeTab, setActiveTab] = useState<'help' | 'feedback'>('help')
  
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingRating, setExistingRating] = useState<SatisfactionRating | null>(null)
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug')
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackDescription, setFeedbackDescription] = useState('')
  const [feedbackContact, setFeedbackContact] = useState('')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [satRes, fbRes, featRes] = await Promise.all([
        feedbackApi.getSatisfaction(),
        feedbackApi.getFeedbacks(),
        feedbackApi.getFeatures(),
      ])
      if (satRes.rating) {
        setExistingRating(satRes.rating)
        setRating(satRes.rating.rating)
        setComment(satRes.rating.comment || '')
      }
      setFeedbacks(fbRes.data)
      setFeatureRequests(featRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error(t('about.feedback.ratingFailed'))
      return
    }
    setLoading(true)
    try {
      await feedbackApi.submitSatisfaction(rating, comment)
      toast.success(t('about.feedback.ratingSuccess'))
      loadData()
    } catch (error) {
      toast.error(t('about.feedback.ratingFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackTitle || !feedbackDescription) {
      toast.error(t('about.feedback.feedbackFailed'))
      return
    }
    setLoading(true)
    try {
      await feedbackApi.createFeedback({
        type: feedbackType,
        title: feedbackTitle,
        description: feedbackDescription,
        contact: feedbackContact,
      })
      toast.success(t('about.feedback.feedbackSuccess'))
      setFeedbackTitle('')
      setFeedbackDescription('')
      setFeedbackContact('')
      loadData()
    } catch (error) {
      toast.error(t('about.feedback.feedbackFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (featureId: number, hasVoted: boolean) => {
    try {
      if (hasVoted) {
        await feedbackApi.unvoteFeature(featureId)
        toast.success(t('about.feedback.unvoteSuccess'))
      } else {
        await feedbackApi.voteFeature(featureId)
        toast.success(t('about.feedback.voteSuccess'))
      }
      loadData()
    } catch (error) {
      toast.error(t('about.feedback.voteFailed'))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusKey = `about.feedback.status.${status}` as const
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      resolved: 'outline',
      closed: 'outline',
    }
    return <Badge variant={variants[status] || 'secondary'}>{t(statusKey)}</Badge>
  }

  const getFeatureStatusBadge = (status: string) => {
    const statusKey = `about.feedback.featureStatus.${status}` as const
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      planned: 'secondary',
      in_progress: 'default',
      completed: 'outline',
    }
    return <Badge variant={variants[status] || 'secondary'}>{t(statusKey)}</Badge>
  }

  const features = [
    { key: 'multiModel', icon: Sparkles },
    { key: 'noteSave', icon: CheckCircle },
    { key: 'knowledgeBase', icon: Lightbulb },
    { key: 'export', icon: Rocket },
  ]

  const quickStartSteps = ['step1', 'step2', 'step3']
  const faqItems = ['q1', 'q2', 'q3', 'q4']

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-center gap-4 p-4 max-w-4xl mx-auto relative">
          <Link href="/" className="absolute left-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{t('helpFeedback.title')}</h1>
        </div>
      </div>

      <div className="border-b bg-background">
        <div className="flex gap-1 p-1 max-w-4xl mx-auto">
          <Button
            variant={activeTab === 'help' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('help')}
            className="flex-1"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            {t('helpFeedback.helpTab')}
          </Button>
          <Button
            variant={activeTab === 'feedback' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('feedback')}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('helpFeedback.feedbackTab')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {activeTab === 'help' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    {t('about.help.overview')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('about.help.overviewContent')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {t('about.help.features')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {features.map(({ key, icon: Icon }) => (
                      <div key={key} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">{t(`about.help.featuresList.${key}.title`)}</h4>
                          <p className="text-sm text-muted-foreground">{t(`about.help.featuresList.${key}.desc`)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    {t('about.help.quickStart')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {quickStartSteps.map((step, index) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{t(`about.help.quickStartSteps.${step}`)}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    {t('about.help.faq')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {faqItems.map((item) => (
                      <div key={item} className="space-y-1">
                        <h4 className="font-medium">{t(`about.help.faqList.${item}.q`)}</h4>
                        <p className="text-sm text-muted-foreground">{t(`about.help.faqList.${item}.a`)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {t('about.feedback.satisfaction')}
                  </CardTitle>
                  <CardDescription>{t('about.feedback.satisfactionDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={t('about.feedback.satisfactionPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleRatingSubmit} disabled={loading || rating === 0}>
                    {existingRating ? t('about.feedback.updateRating') : t('about.feedback.submitRating')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {t('about.feedback.submitFeedback')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('about.feedback.feedbackType')}</Label>
                    <RadioGroup
                      value={feedbackType}
                      onValueChange={(v) => setFeedbackType(v as 'bug' | 'feature' | 'other')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bug" id="bug" />
                        <Label htmlFor="bug">{t('about.feedback.bugReport')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="feature" id="feature" />
                        <Label htmlFor="feature">{t('about.feedback.featureSuggestion')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">{t('about.feedback.other')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('about.feedback.title_placeholder')}</Label>
                    <Input
                      id="title"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('about.feedback.description_placeholder')}</Label>
                    <Textarea
                      id="description"
                      value={feedbackDescription}
                      onChange={(e) => setFeedbackDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">{t('about.feedback.contact_placeholder')}</Label>
                    <Input
                      id="contact"
                      value={feedbackContact}
                      onChange={(e) => setFeedbackContact(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleFeedbackSubmit} disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    {t('about.feedback.submit')}
                  </Button>
                </CardContent>
              </Card>

              {feedbacks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      {t('about.feedback.feedbackHistory')} ({feedbacks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {feedbacks.map((fb) => (
                        <div key={fb.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{fb.title}</span>
                              {getStatusBadge(fb.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{fb.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5" />
                    {t('about.feedback.featureVoting')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {featureRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">{t('about.feedback.noFeatures')}</p>
                  ) : (
                    <div className="space-y-3">
                      {featureRequests.map((feature) => (
                        <div key={feature.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feature.title}</span>
                              {getFeatureStatusBadge(feature.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-muted-foreground">{feature.vote_count} {t('about.feedback.votes')}</span>
                            <Button
                              variant={feature.has_voted ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleVote(feature.id, feature.has_voted)}
                            >
                              <ThumbsUp className={`h-4 w-4 mr-1 ${feature.has_voted ? 'fill-current' : ''}`} />
                              {feature.has_voted ? t('about.feedback.unvote') : t('about.feedback.vote')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
